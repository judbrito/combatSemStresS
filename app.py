import sqlite3
import json
import os
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash

app = Flask(__name__, static_folder='static', template_folder='templates')
DATABASE = 'database.db'

# >>> MUITO IMPORTANTE: Mude esta chave para uma string aleatória longa e complexa! <<<
# Você pode gerar uma com: import os; os.urandom(24)
app.config['SECRET_KEY'] = 'sua_chave_secreta_muito_segura_e_longa_aqui_4321_abcde'

# Credenciais do administrador
ADMIN_USERNAME = 'admoceano'
ADMIN_PASSWORD = '4107'

# Função para obter conexão com o banco de dados
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Função para inicializar o banco de dados e criar tabelas se não existirem
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Tabela combat_history
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS combat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            ranking_json TEXT NOT NULL
        )
    ''')

    # Tabela global_ranking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS global_ranking (
            name TEXT PRIMARY KEY,
            score INTEGER NOT NULL DEFAULT 0,
            lealdade INTEGER NOT NULL DEFAULT 500 -- NOVA COLUNA ADICIONADA
        )
    ''')

    # Verifica se a coluna 'lealdade' já existe para evitar erro em DBs existentes
    try:
        cursor.execute("ALTER TABLE global_ranking ADD COLUMN lealdade INTEGER NOT NULL DEFAULT 500")
    except sqlite3.OperationalError as e:
        if "duplicate column name: lealdade" not in str(e):
            raise e # Relança o erro se for algo diferente de coluna duplicada
        # Se for "duplicate column name", ignora, pois a coluna já existe.

    conn.commit()
    conn.close()

# Garante que o banco de dados é inicializado antes da primeira requisição
@app.before_request
def before_request():
    if not os.path.exists(DATABASE):
        init_db()
    else:
        # Se o banco já existe, mas a coluna de lealdade foi adicionada depois,
        # podemos tentar adicioná-la aqui também.
        # Isto é uma forma simples de "migração" para SQLite direto.
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("ALTER TABLE global_ranking ADD COLUMN lealdade INTEGER NOT NULL DEFAULT 500")
            conn.commit()
        except sqlite3.OperationalError as e:
            if "duplicate column name: lealdade" not in str(e):
                print(f"Erro ao adicionar coluna 'lealdade': {e}") # Para depuração
        finally:
            conn.close()

# --- Rotas de Autenticação (Mantidas) ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['logged_in'] = True
            flash('Login realizado com sucesso!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Nome de usuário ou senha inválidos.', 'danger')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('Você foi desconectado.', 'info')
    return redirect(url_for('index'))

# Função auxiliar para verificar se o usuário é administrador
def is_admin():
    return session.get('logged_in')

# --- Rotas do Jogo ---
@app.route('/')
def index():
    return render_template('index.html', is_admin=is_admin())

# Rota para salvar resultados de combate (atualizada para usar lealdade)
@app.route('/save_combat_results', methods=['POST'])
def save_combat_results():
    data = request.json
    if not data or 'ranking' not in data:
        return jsonify({'status': 'error', 'message': 'Dados inválidos'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    timestamp = datetime.now().strftime('%d/%m/%Y %H:%M:%S')

    human_players_ranking = []
    for p in data['ranking']:
        # Garante que 'isAI' está presente e é False para ser um jogador humano
        # E que 'name' e 'score' estão presentes
        if not p.get('isAI', False) and 'name' in p and 'score' in p:
            human_players_ranking.append(p)

    # Salva apenas os resultados dos jogadores humanos no histórico de combate.
    cursor.execute(
        "INSERT INTO combat_history (timestamp, ranking_json) VALUES (?, ?)",
        (timestamp, json.dumps(human_players_ranking))
    )

    # Atualiza o score e a lealdade no ranking global APENAS para jogadores humanos.
    for player_data in human_players_ranking:
        player_name = player_data['name']
        player_score_this_round = player_data['score']
        # Assumindo que a 'lealdade' também virá no JSON do `save_combat_results` se for relevante para a rodada
        # Se a lealdade é um atributo do jogador que pode mudar, deve vir aqui.
        # Caso contrário, pegue a lealdade existente ou use um default.
        player_lealdade = player_data.get('loyalty', 500) # Use a lealdade enviada ou default 500

        # Atualiza a lealdade APENAS se um valor diferente de 0 ou um valor válido for fornecido
        # A atualização de score é sempre acumulativa
        cursor.execute(
            "INSERT INTO global_ranking (name, score, lealdade) VALUES (?, ?, ?) "
            "ON CONFLICT(name) DO UPDATE SET score = score + ?, lealdade = ?", # Adicionada atualização de lealdade
            (player_name, player_score_this_round, player_lealdade, player_score_this_round, player_lealdade)
        )
    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'message': 'Resultados salvos com sucesso!'})


@app.route('/get_combat_history', methods=['GET'])
def get_combat_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT timestamp, ranking_json FROM combat_history ORDER BY id DESC")
    history_rows = cursor.fetchall()
    conn.close()

    history = []
    for row in history_rows:
        history.append({
            'timestamp': row['timestamp'],
            'ranking': json.loads(row['ranking_json'])
        })
    return jsonify({'status': 'success', 'history': history})

# Rota para obter o Ranking Global (AGORA INCLUI LEALDADE)
@app.route('/get_global_ranking', methods=['GET'])
def get_global_ranking():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Ordena por score (pontos) e depois por lealdade para desempate
    cursor.execute("SELECT name, score, lealdade FROM global_ranking ORDER BY score DESC, lealdade DESC")
    ranking_rows = cursor.fetchall()
    conn.close()

    ranking = [{'nick': row['name'], 'pontos_totais': row['score'], 'lealdade': row['lealdade']} for row in ranking_rows]
    return jsonify({'status': 'success', 'ranking': ranking})

@app.route('/clear_data', methods=['POST'])
def clear_data():
    if not is_admin():
        return jsonify({'status': 'error', 'message': 'Acesso negado. Apenas administradores podem limpar dados.'}), 403
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM combat_history")
    cursor.execute("DELETE FROM global_ranking")
    conn.commit()
    conn.close()
    init_db() # Reinicializa as tabelas para garantir que existam e com a estrutura correta
    return jsonify({'status': 'success', 'message': 'Dados apagados com sucesso!'})

# Rota para registrar participante (atualizada para usar a nova coluna lealdade)
@app.route('/register_participant', methods=['POST'])
def register_participant():
    data = request.json
    if not data or 'name' not in data or 'loyalty' not in data:
        return jsonify({'status': 'error', 'message': 'Nome do participante e lealdade são obrigatórios.'}), 400

    participant_name = data['name'].strip()
    loyalty_value = int(data['loyalty'])

    if not participant_name:
        return jsonify({'status': 'error', 'message': 'O nome do participante não pode ser vazio.'}), 400
    if loyalty_value < 0 or loyalty_value > 1000: # Lealdade entre 0 e 1000
        return jsonify({'status': 'error', 'message': 'Lealdade deve ser um número entre 0 e 1000.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Tenta inserir. Se o nome já existe (ON CONFLICT), apenas atualiza a lealdade.
    # O score é mantido.
    cursor.execute(
        "INSERT INTO global_ranking (name, score, lealdade) VALUES (?, 0, ?) "
        "ON CONFLICT(name) DO UPDATE SET lealdade = ?", # Atualiza apenas lealdade no registro
        (participant_name, loyalty_value, loyalty_value)
    )
    conn.commit()
    conn.close()

    flash(f'Participante "{participant_name}" registrado/atualizado.', 'success')
    return jsonify({
        'status': 'success',
        'message': f'Participante "{participant_name}" registrado/atualizado.',
        'participant': {'name': participant_name, 'loyalty': loyalty_value}
    })

# NOVA ROTA: Adicionar Múltiplos Participantes (somente para admin)
@app.route('/admin/add_multiple_participants', methods=['POST'])
def admin_add_multiple_participants():
    if not is_admin():
        return jsonify({'status': 'error', 'message': 'Acesso negado. Apenas administradores.'}), 403

    nicks_raw = request.json.get('nicks') # Espera uma string de nicks separados por vírgula ou nova linha
    if not nicks_raw:
        return jsonify({'status': 'error', 'message': 'Nicks são obrigatórios.'}), 400

    nicks = [nick.strip() for nick in nicks_raw.replace('\n', ',').split(',') if nick.strip()]
    
    if not nicks:
        return jsonify({'status': 'error', 'message': 'Nenhum nick válido encontrado para adicionar.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    added_count = 0
    updated_count = 0

    for nick in nicks:
        try:
            # Tenta inserir. Se o nome já existe, não faz nada (IGNORA).
            # Queremos apenas garantir que o participante exista no ranking,
            # sem alterar score ou lealdade se ele já estiver lá.
            cursor.execute(
                "INSERT OR IGNORE INTO global_ranking (name, score, lealdade) VALUES (?, 0, 500)",
                (nick,)
            )
            if cursor.rowcount > 0: # Se uma linha foi inserida, é um novo participante
                added_count += 1
            else:
                updated_count += 1 # Já existia, consideramos "encontrado/atualizado" indiretamente
        except Exception as e:
            print(f"Erro ao processar nick '{nick}': {e}")
            # Você pode coletar erros específicos se desejar
    
    conn.commit()
    conn.close()

    return jsonify({
        'status': 'success',
        'message': f'Processado: {added_count} novos participantes adicionados, {updated_count} existentes encontrados.',
        'added_count': added_count,
        'updated_count': updated_count
    })

# PONTO DE ATENÇÃO: Seu app.py atual tem um bloco de código Flask-SQLAlchemy no final.
# Remova este bloco, pois você está usando sqlite3 diretamente.
# REMOVA TUDO A PARTIR DAQUI:
# app.py (ou models.py, se preferir)
# from flask_sqlalchemy import SQLAlchemy
# ...
# FIM DO BLOCO A REMOVER

if __name__ == '__main__':
    # Garante que as pastas static e templates existam
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    init_db() # Garante que o banco e a estrutura estejam corretos
    app.run(debug=True)