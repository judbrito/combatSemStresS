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
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS combat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            ranking_json TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS global_ranking (
            name TEXT PRIMARY KEY,
            score INTEGER NOT NULL DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

# Garante que o banco de dados é inicializado antes da primeira requisição
@app.before_request
def before_request():
    if not os.path.exists(DATABASE):
        init_db()

# --- Rotas de Autenticação ---
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

@app.route('/save_combat_results', methods=['POST'])
def save_combat_results():
    data = request.json
    if not data or 'ranking' not in data:
        return jsonify({'status': 'error', 'message': 'Dados inválidos'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    timestamp = datetime.now().strftime('%d/%m/%Y %H:%M:%S')

    # Filtra o ranking para salvar apenas jogadores humanos no histórico e ranking global.
    # Adicionei um `.get('isAI', False)` para verificar a propriedade 'isAI' com segurança.
    human_players_ranking = [p for p in data['ranking'] if not p.get('isAI', False)]

    # Salva apenas os resultados dos jogadores humanos no histórico de combate.
    cursor.execute(
        "INSERT INTO combat_history (timestamp, ranking_json) VALUES (?, ?)",
        (timestamp, json.dumps(human_players_ranking))
    )

    # Atualiza o score no ranking global APENAS para jogadores humanos.
    for player_data in human_players_ranking:
        player_name = player_data['name']
        player_score_this_round = player_data['score']

        cursor.execute(
            "INSERT INTO global_ranking (name, score) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET score = score + ?",
            (player_name, player_score_this_round, player_score_this_round)
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

@app.route('/get_global_ranking', methods=['GET'])
def get_global_ranking():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, score FROM global_ranking ORDER BY score DESC")
    ranking_rows = cursor.fetchall()
    conn.close()

    ranking = [{'name': row['name'], 'score': row['score']} for row in ranking_rows]
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
    init_db() # Reinicializa as tabelas para garantir que existam
    return jsonify({'status': 'success', 'message': 'Dados apagados com sucesso!'})

@app.route('/register_participant', methods=['POST'])
def register_participant():
    data = request.json
    if not data or 'name' not in data or 'loyalty' not in data:
        return jsonify({'status': 'error', 'message': 'Nome do participante e lealdade são obrigatórios.'}), 400

    participant_name = data['name'].strip()
    loyalty_value = int(data['loyalty'])

    if not participant_name:
        return jsonify({'status': 'error', 'message': 'O nome do participante não pode ser vazio.'}), 400
    if loyalty_value < 0: # Permitir 0, mas geralmente > 0 faz mais sentido para lealdade
        return jsonify({'status': 'error', 'message': 'O valor de lealdade deve ser positivo ou zero.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Adiciona/Atualiza o participante na tabela global_ranking (ou cria se não existir)
    # A lealdade não é salva no DB por padrão, apenas o nome e score.
    # Se quiser salvar a lealdade, precisaria de uma nova coluna na tabela global_ranking.
    cursor.execute(
        "INSERT OR IGNORE INTO global_ranking (name, score) VALUES (?, 0)",
        (participant_name,)
    )
    conn.commit()
    conn.close()

    return jsonify({
        'status': 'success',
        'message': f'Participante "{participant_name}" registrado.',
        'participant': {'name': participant_name, 'loyalty': loyalty_value} # Retorna a lealdade para o frontend
    })

if __name__ == '__main__':
    # Garante que as pastas static e templates existam
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    init_db()
    app.run(debug=True)