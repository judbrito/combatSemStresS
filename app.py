from flask import Flask, render_template, send_from_directory, request, jsonify
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os

# Opcional: Carregar variáveis de ambiente do .env para desenvolvimento local
# Remova ou comente esta linha em produção se a Render já configura as vars
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass # python-dotenv não está instalado ou não é necessário

app = Flask(__name__)

# --- Conexão com MongoDB ---
# Use a variável de ambiente MONGODB_URI fornecida pela Render.com
# Em desenvolvimento local, você pode definir MONGODB_URI no seu arquivo .env
MONGO_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('MONGO_DB_NAME', 'combat_stress_db') # Nome do seu banco de dados
COLLECTION_NAME = 'player_scores' # Nome da coleção onde as pontuações serão salvas

client = None
db = None
try:
    client = MongoClient(MONGO_URI)
    client.admin.command('ping') # Testa a conexão
    db = client[DB_NAME]
    print(f"Conexão com MongoDB estabelecida para o banco de dados: {DB_NAME}")
except ConnectionFailure as e:
    print(f"Erro ao conectar ao MongoDB: {e}")
    # Em produção, você pode querer sair ou lidar com isso de forma mais robusta
    db = None # Garante que 'db' não seja usado se a conexão falhar


# Remova ou comente as funções relacionadas a game_data.json
# GAME_DATA_FILE = 'game_data.json'
# def load_game_data():
#    ...
# def save_game_data(data):
#    ...


@app.route('/')
def index():
    """Serve a página principal do jogo."""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve arquivos estáticos (CSS, JS)."""
    return send_from_directory('static', filename)

# Rotas de exemplo para combat.html e login.html (Atualmente não usados pelo frontend do jogo)
@app.route('/combat')
def combat():
    """Página de exemplo para combate."""
    return render_template('combat.html')

@app.route('/login')
def login():
    """Página de exemplo para login."""
    return render_template('login.html')

# --- NOVAS ROTAS DE API PARA PONTUAÇÕES ---

@app.route('/api/save_score', methods=['POST'])
def save_score():
    """Recebe a pontuação de um jogador do frontend e salva no MongoDB."""
    if db is None:
        return jsonify({'message': 'Erro interno do servidor: banco de dados não conectado'}), 500

    data = request.get_json()
    if not data or 'name' not in data or 'score' not in data:
        return jsonify({'message': 'Dados inválidos. Requer nome e pontuação.'}), 400

    player_name = data['name']
    player_score = data['score']

    try:
        # Insere o documento na coleção
        result = db[COLLECTION_NAME].insert_one({
            'name': player_name,
            'score': player_score,
            'timestamp': db.func.now() # MongoDB pode usar um timestamp direto ou datetime
        })
        return jsonify({'message': 'Pontuação salva com sucesso!', 'id': str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Erro ao salvar pontuação no MongoDB: {e}")
        return jsonify({'message': 'Erro interno ao salvar pontuação'}), 500

@app.route('/api/get_scores', methods=['GET'])
def get_scores():
    """Retorna todas as pontuações salvas do MongoDB, ordenadas pela pontuação."""
    if db is None:
        return jsonify({'message': 'Erro interno do servidor: banco de dados não conectado'}), 500

    try:
        # Busca todos os documentos, ordena por 'score' em ordem decrescente
        scores = list(db[COLLECTION_NAME].find({}, {'_id': 0}).sort('score', -1))
        return jsonify(scores), 200
    except Exception as e:
        print(f"Erro ao buscar pontuações do MongoDB: {e}")
        return jsonify({'message': 'Erro interno ao buscar pontuações'}), 500

# --- Bloco de Inicialização (para uso local) ---
if __name__ == '__main__':
    # Remover o código de criação do game_data.json
    # if not os.path.exists(GAME_DATA_FILE):
    #    ...

    # Em um ambiente de produção com Gunicorn, esta parte não é usada.
    # A conexão com o MongoDB será feita na inicialização do módulo.
    print("Iniciando Flask em modo de desenvolvimento...")
    app.run(host='0.0.0.0', port=5000, debug=True)