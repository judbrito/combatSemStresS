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
ADMIN_PASSWORD = '4107' # Por favor, mude esta senha em produção!

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
<<<<<<< HEAD
            lealdade INTEGER NOT NULL DEFAULT 500
=======
<<<<<<< HEAD
            loyalty INTEGER DEFAULT 500 -- Added loyalty column
=======
            lealdade INTEGER NOT NULL DEFAULT 500
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
        )
    ''')

    # Adiciona a coluna 'lealdade' se ela não existir
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
<<<<<<< HEAD
=======
<<<<<<< HEAD
    # Check if 'loyalty' column exists in global_ranking, if not, add it
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(global_ranking)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'loyalty' not in columns:
        cursor.execute("ALTER TABLE global_ranking ADD COLUMN loyalty INTEGER DEFAULT 500")
        conn.commit()
    conn.close()

=======
>>>>>>> 47e96ba (foi)
    else:
        # Tenta adicionar a coluna 'lealdade' se o banco já existe mas a coluna não.
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("PRAGMA table_info(global_ranking);")
            columns = [col[1] for col in cursor.fetchall()]
            if 'lealdade' not in columns:
                cursor.execute("ALTER TABLE global_ranking ADD COLUMN lealdade INTEGER NOT NULL DEFAULT 500")
                conn.commit()
        except sqlite3.OperationalError as e:
            # Isso é para pegar erros em tempo de execução se a coluna for adicionada por outra forma,
            # mas o PRAGMA table_info deve evitar o "duplicate column name".
            print(f"Erro ao verificar/adicionar coluna 'lealdade' em before_request: {e}") # Para depuração
        finally:
            conn.close()
<<<<<<< HEAD
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)

# --- Rotas de Autenticação ---
@app.route('/login', methods=['GET', 'POST']) # Adicionado GET para permitir que a página de login seja carregada
def login():
    if request.method == 'POST':
        # >>> CORREÇÃO AQUI: Use request.form para dados de formulário HTML <<<
        username = request.form.get('username')
        password = request.form.get('password')

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['logged_in'] = True
            # Flash message para feedback visual
            flash('Login realizado com sucesso!', 'success')
            # Redireciona para a página principal ou onde o admin deva ir após o login
            return redirect(url_for('index'))
        else:
            # Flash message para feedback visual
            flash('Nome de usuário ou senha inválidos.', 'danger')
            # Retorna para a página de login com a mensagem de erro
            # O status 401 é correto para falha de autenticação.
            return render_template('login.html', is_admin=is_admin()), 401
    
    # Para requisições GET, simplesmente renderize a página de login
    return render_template('login.html', is_admin=is_admin())

@app.route('/logout', methods=['GET', 'POST']) # Permitir GET para um link simples, mas POST para um botão mais seguro
def logout():
    session.pop('logged_in', None)
    flash('Você foi desconectado.', 'info')
    return redirect(url_for('index')) # Redireciona para a página inicial após o logout

# Função auxiliar para verificar se o usuário é administrador
def is_admin():
    return session.get('logged_in', False) # Adicionado False como default

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

<<<<<<< HEAD
=======
<<<<<<< HEAD
    # Filtra o ranking para salvar apenas jogadores humanos no histórico e ranking global.
    human_players_ranking = [p for p in data['ranking'] if not p.get('isAI', False)]
=======
>>>>>>> 47e96ba (foi)
    human_players_ranking = []
    for p in data['ranking']:
        # Garante que 'isAI' está presente e é False para ser um jogador humano
        # E que 'name' e 'score' estão presentes
        if not p.get('isAI', False) and 'name' in p and 'score' in p:
            human_players_ranking.append(p)
<<<<<<< HEAD
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)

    # Salva apenas os resultados dos jogadores humanos no histórico de combate.
    cursor.execute(
        "INSERT INTO combat_history (timestamp, ranking_json) VALUES (?, ?)",
        (timestamp, json.dumps(human_players_ranking))
    )

    # Atualiza o score e a lealdade no ranking global APENAS para jogadores humanos.
    for player_data in human_players_ranking:
        player_name = player_data['name']
        player_score_this_round = player_data['score']
        # Usa a lealdade enviada ou default 500
        player_lealdade = player_data.get('loyalty', 500)

        # Atualiza o score de forma cumulativa e a lealdade.
        cursor.execute(
            "INSERT INTO global_ranking (name, score, lealdade) VALUES (?, ?, ?) "
            "ON CONFLICT(name) DO UPDATE SET score = score + ?, lealdade = ?",
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
<<<<<<< HEAD
    # Ordena por score (pontos) e depois por lealdade para desempate
    cursor.execute("SELECT name, score, lealdade FROM global_ranking ORDER BY score DESC, lealdade DESC")
    ranking_rows = cursor.fetchall()
    conn.close()

    # O formato de retorno corresponde ao esperado pelo frontend para exportação/visualização
    ranking = [{'nick': row['name'], 'pontos_totais': row['score'], 'lealdade': row['lealdade']} for row in ranking_rows]
=======
<<<<<<< HEAD
    # Fetch loyalty as well
    cursor.execute("SELECT name, score, loyalty FROM global_ranking ORDER BY score DESC")
    ranking_rows = cursor.fetchall()
    conn.close()

    ranking = [{'name': row['name'], 'score': row['score'], 'loyalty': row['loyalty']} for row in ranking_rows]
=======
    # Ordena por score (pontos) e depois por lealdade para desempate
    cursor.execute("SELECT name, score, lealdade FROM global_ranking ORDER BY score DESC, lealdade DESC")
    ranking_rows = cursor.fetchall()
    conn.close()

    # O formato de retorno corresponde ao esperado pelo frontend para exportação/visualização
    ranking = [{'nick': row['name'], 'pontos_totais': row['score'], 'lealdade': row['lealdade']} for row in ranking_rows]
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
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
<<<<<<< HEAD
    init_db() # Reinicializa as tabelas para garantir que existam e com a estrutura correta
=======
<<<<<<< HEAD
    init_db() # Reinicializa as tabelas para garantir que existam
    flash('Dados de histórico e ranking limpos com sucesso!', 'info') # Added flash message
=======
    init_db() # Reinicializa as tabelas para garantir que existam e com a estrutura correta
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
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
<<<<<<< HEAD
    if loyalty_value < 0 or loyalty_value > 1000: # Lealdade entre 0 e 1000
        return jsonify({'status': 'error', 'message': 'Lealdade deve ser um número entre 0 e 1000.'}), 400
=======
<<<<<<< HEAD
    if not (0 <= loyalty_value <= 1000): # Ensure loyalty is within valid range
        return jsonify({'status': 'error', 'message': 'O valor de lealdade deve ser entre 0 e 1000.'}), 400

=======
    if loyalty_value < 0 or loyalty_value > 1000: # Lealdade entre 0 e 1000
        return jsonify({'status': 'error', 'message': 'Lealdade deve ser um número entre 0 e 1000.'}), 400
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)

    conn = get_db_connection()
    cursor = conn.cursor()

<<<<<<< HEAD
    # Tenta inserir. Se o nome já existe (ON CONFLICT), apenas atualiza a lealdade e mantém o score existente.
    # O score é definido como 0 se for um novo participante.
    cursor.execute(
        "INSERT INTO global_ranking (name, score, lealdade) VALUES (?, 0, ?) "
        "ON CONFLICT(name) DO UPDATE SET lealdade = ?",
        (participant_name, loyalty_value, loyalty_value)
=======
<<<<<<< HEAD
    # Add/Update the participant in the global_ranking table, including loyalty
    cursor.execute(
        "INSERT INTO global_ranking (name, score, loyalty) VALUES (?, 0, ?) ON CONFLICT(name) DO UPDATE SET loyalty = ?",
        (participant_name, loyalty_value, loyalty_value) # Update loyalty if name exists
=======
    # Tenta inserir. Se o nome já existe (ON CONFLICT), apenas atualiza a lealdade e mantém o score existente.
    # O score é definido como 0 se for um novo participante.
    cursor.execute(
        "INSERT INTO global_ranking (name, score, lealdade) VALUES (?, 0, ?) "
        "ON CONFLICT(name) DO UPDATE SET lealdade = ?",
        (participant_name, loyalty_value, loyalty_value)
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
    )
    conn.commit()
    conn.close()

    # Recupera os dados completos do participante (incluindo o score existente) para retornar
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, score, lealdade FROM global_ranking WHERE name = ?", (participant_name,))
    participant_data = cursor.fetchone()
    conn.close()

    return jsonify({
        'status': 'success',
<<<<<<< HEAD
        'message': f'Participante "{participant_name}" registrado/atualizado.',
        'participant': {'name': participant_data['name'], 'loyalty': participant_data['lealdade'], 'score': participant_data['score']}
=======
<<<<<<< HEAD
        'message': f'Participante "{participant_name}" registrado.',
        'participant': {'name': participant_name, 'loyalty': loyalty_value} # Returns loyalty to frontend
>>>>>>> 47e96ba (foi)
    })

# ATUALIZADO: Rota para Adicionar Múltiplos Participantes (somente para admin)
# Agora espera um JSON com uma lista de objetos de participante, incluindo nome, score e lealdade
@app.route('/admin/add_multiple_participants', methods=['POST'])
def admin_add_multiple_participants():
    if not is_admin():
        return jsonify({'status': 'error', 'message': 'Acesso negado. Apenas administradores.'}), 403

    data = request.json
    participants_data = data.get('participants') # Espera um array de objetos de participante

    if not participants_data or not isinstance(participants_data, list):
        return jsonify({'status': 'error', 'message': 'Dados inválidos. Esperado um array de participantes.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Contadores para feedback mais detalhado (opcional, mas bom para o admin)
    added_count = 0
    updated_count = 0
    errors = []

    for p_data in participants_data:
        name = p_data.get('name')
        loyalty = p_data.get('loyalty', 500) # Default 500 se não fornecido
        score = p_data.get('score', 0)     # Default 0 se não fornecido

        if not name or not isinstance(name, str) or not name.strip():
            errors.append(f"Nome inválido ou vazio encontrado: {p_data}. Ignorado.")
            continue # Pula este item se o nome for inválido

        try:
            # Verifica se o participante já existe
            cursor.execute("SELECT 1 FROM global_ranking WHERE name = ?", (name,))
            exists = cursor.fetchone()

            # Insere ou atualiza o participante.
            # Se existir, atualiza score e lealdade com os valores fornecidos.
            # Se não existir, insere um novo com os valores fornecidos.
            cursor.execute(
                "INSERT INTO global_ranking (name, score, lealdade) VALUES (?, ?, ?) "
                "ON CONFLICT(name) DO UPDATE SET score = ?, lealdade = ?",
                (name, score, loyalty, score, loyalty) # Valores para INSERT, depois para UPDATE
            )
            
            if exists:
                updated_count += 1
            else:
                added_count += 1
        except Exception as e:
            errors.append(f"Erro ao processar participante '{name}': {e}")
    
    conn.commit()
    conn.close()

    message = f'Processamento concluído: {added_count} novos participantes adicionados, {updated_count} existentes atualizados.'
    if errors:
<<<<<<< HEAD
=======
        flash(f'Registro em massa concluído com {registered_count} participantes registrados. Erros: {", ".join(errors)}', 'danger')
        return jsonify({'status': 'warning', 'message': f'Alguns participantes não puderam ser registrados. Verifique os erros.', 'registered_count': registered_count, 'errors': errors})
    else:
        flash(f'Todos os {registered_count} participantes foram registrados com sucesso!', 'success')
        return jsonify({'status': 'success', 'message': f'{registered_count} participantes registrados com sucesso!'})
=======
        'message': f'Participante "{participant_name}" registrado/atualizado.',
        'participant': {'name': participant_data['name'], 'loyalty': participant_data['lealdade'], 'score': participant_data['score']}
    })

# ATUALIZADO: Rota para Adicionar Múltiplos Participantes (somente para admin)
# Agora espera um JSON com uma lista de objetos de participante, incluindo nome, score e lealdade
@app.route('/admin/add_multiple_participants', methods=['POST'])
def admin_add_multiple_participants():
    if not is_admin():
        return jsonify({'status': 'error', 'message': 'Acesso negado. Apenas administradores.'}), 403

    data = request.json
    participants_data = data.get('participants') # Espera um array de objetos de participante

    if not participants_data or not isinstance(participants_data, list):
        return jsonify({'status': 'error', 'message': 'Dados inválidos. Esperado um array de participantes.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Contadores para feedback mais detalhado (opcional, mas bom para o admin)
    added_count = 0
    updated_count = 0
    errors = []

    for p_data in participants_data:
        name = p_data.get('name')
        loyalty = p_data.get('loyalty', 500) # Default 500 se não fornecido
        score = p_data.get('score', 0)     # Default 0 se não fornecido

        if not name or not isinstance(name, str) or not name.strip():
            errors.append(f"Nome inválido ou vazio encontrado: {p_data}. Ignorado.")
            continue # Pula este item se o nome for inválido

        try:
            # Verifica se o participante já existe
            cursor.execute("SELECT 1 FROM global_ranking WHERE name = ?", (name,))
            exists = cursor.fetchone()

            # Insere ou atualiza o participante.
            # Se existir, atualiza score e lealdade com os valores fornecidos.
            # Se não existir, insere um novo com os valores fornecidos.
            cursor.execute(
                "INSERT INTO global_ranking (name, score, lealdade) VALUES (?, ?, ?) "
                "ON CONFLICT(name) DO UPDATE SET score = ?, lealdade = ?",
                (name, score, loyalty, score, loyalty) # Valores para INSERT, depois para UPDATE
            )
            
            if exists:
                updated_count += 1
            else:
                added_count += 1
        except Exception as e:
            errors.append(f"Erro ao processar participante '{name}': {e}")
    
    conn.commit()
    conn.close()

    message = f'Processamento concluído: {added_count} novos participantes adicionados, {updated_count} existentes atualizados.'
    if errors:
>>>>>>> 47e96ba (foi)
        message += f' Alguns erros ocorreram: {"; ".join(errors)}'

    return jsonify({
        'status': 'success',
        'message': message,
        'added_count': added_count,
        'updated_count': updated_count,
        'errors': errors
    })

# NOVO: Rota para Importar Ranking (somente para admin)
# Esta rota irá sobrescrever ou inserir dados no ranking global
@app.route('/admin/import_ranking', methods=['POST'])
def admin_import_ranking():
    if not is_admin():
        return jsonify({'status': 'error', 'message': 'Acesso negado. Apenas administradores.'}), 403

    data = request.json
    ranking_data = data.get('ranking_data') # Espera um array de objetos de ranking

    if not ranking_data or not isinstance(ranking_data, list):
        return jsonify({'status': 'error', 'message': 'Dados inválidos. Esperado um array de dados de ranking.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    imported_count = 0
    errors = []

    for item in ranking_data:
        # Validar cada item
        if not all(k in item for k in ['nome', 'lealdade', 'pontos']):
            errors.append(f"Item de ranking com campos faltando (esperado 'nome', 'lealdade', 'pontos'): {item}. Ignorado.")
            continue

        name = item['nome'].strip()
        try:
            lealdade = int(item['lealdade'])
            pontos = int(item['pontos'])
        except ValueError:
            errors.append(f"Valores de lealdade ou pontos inválidos para '{name}': {item}. Ignorado.")
            continue

        if not name:
            errors.append(f"Nome vazio encontrado no item: {item}. Ignorado.")
            continue
        if lealdade < 0 or lealdade > 1000:
            errors.append(f"Lealdade inválida ({lealdade}) para '{name}'. Definido para 500.")
            lealdade = 500 # Default se inválido
        if pontos < 0:
            errors.append(f"Pontos negativos ({pontos}) para '{name}'. Definido para 0.")
            pontos = 0 # Default se inválido

        try:
            # Usa INSERT OR REPLACE para sobrescrever o participante existente ou inserir um novo.
            # Isso significa que o ranking importado define o estado atual, não é cumulativo.
            cursor.execute(
                "INSERT OR REPLACE INTO global_ranking (name, score, lealdade) VALUES (?, ?, ?)",
                (name, pontos, lealdade)
            )
            imported_count += 1
        except Exception as e:
            errors.append(f"Erro ao importar '{name}': {e}")
    
    conn.commit()
    conn.close()

    message = f'{imported_count} participantes importados/atualizados no ranking global.'
    if errors:
        message += f' Alguns erros ocorreram: {"; ".join(errors)}'

    return jsonify({
        'status': 'success',
        'message': message,
        'imported_count': imported_count,
        'errors': errors
    })
<<<<<<< HEAD
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)


if __name__ == '__main__':
    # Garante que as pastas static e templates existam
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    init_db() # Garante que o banco e a estrutura estejam corretos
    app.run(debug=True)
    # ... (seus imports e configurações) ...

# Função para inicializar o banco de dados e criar tabelas se não existirem
# ... (sua função init_db) ...

# Garante que o banco de dados é inicializado antes da primeira requisição
# ... (seu @app.before_request) ...

# --- Função de Lógica de Combate Inicial ---
def run_initial_combat_and_assign_points():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Obter todos os jogadores humanos no ranking global
    cursor.execute("SELECT name, lealdade FROM global_ranking")
    players = cursor.fetchall()
    
    if not players:
        conn.close()
        return "Nenhum jogador para iniciar o combate."

    # 2. Simular um combate e atribuir pontos
    # Lógica de simulação de combate (exemplo simples):
    # Vamos atribuir um score inicial baseado na lealdade, ou aleatoriamente,
    # ou de forma igual para todos. Aqui, vou usar um valor fixo por exemplo.
    
    # Você pode ajustar esta lógica de pontuação conforme desejar.
    # Exemplo: Pontuação aleatória entre 10 e 100
    import random
    combat_results = []
    for player in players:
        player_name = player['name']
        player_lealdade = player['lealdade']
        
        # Simulação de pontos: por exemplo, 50 pontos base + bônus de lealdade (1 a 10)
        # Ou um valor aleatório para simular um combate real
        simulated_score = random.randint(10, 100) # Exemplo: pontos aleatórios
        # simulated_score = 50 + (player_lealdade // 100) # Exemplo: pontos baseados na lealdade
        
        combat_results.append({
            'name': player_name,
            'score': simulated_score,
            'loyalty': player_lealdade,
            'isAI': False # Marcando como não-IA
        })

    # 3. Salvar os resultados do "combate inicial" no histórico
    timestamp = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    cursor.execute(
        "INSERT INTO combat_history (timestamp, ranking_json) VALUES (?, ?)",
        (timestamp, json.dumps(combat_results))
    )

    # 4. Atualizar o score dos jogadores no ranking global
    # Usaremos a mesma lógica de ON CONFLICT do save_combat_results
    for player_data in combat_results:
        player_name = player_data['name']
        player_score_this_round = player_data['score']
        player_lealdade = player_data['loyalty'] # Pega a lealdade simulada

        cursor.execute(
            "INSERT INTO global_ranking (name, score, lealdade) VALUES (?, ?, ?) "
            "ON CONFLICT(name) DO UPDATE SET score = score + ?, lealdade = ?", # Acumula pontos
            (player_name, player_score_this_round, player_lealdade, player_score_this_round, player_lealdade)
        )
    
    conn.commit()
    conn.close()
    return "Combate inicial simulado e pontos atribuídos."

# ... (suas rotas de autenticação e jogo) ...