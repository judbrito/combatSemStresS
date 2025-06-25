from flask import Flask, render_template, send_from_directory, request, jsonify
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from datetime import datetime # Para timestamps
import os

# --- Configuração Opcional para Desenvolvimento Local ---
# Tenta carregar variáveis de ambiente de um arquivo .env
# Comente ou remova esta parte em produção se a Render já configura as vars
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass # python-dotenv não está instalado ou não é necessário

app = Flask(__name__)

# --- Conexão com MongoDB ---
# A MONGODB_URI deve ser configurada como uma variável de ambiente na Render.com
# Em desenvolvimento local, você pode defini-la no seu arquivo .env ou usar um valor padrão local
MONGO_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
# O nome do seu banco de dados dentro do cluster MongoDB
DB_NAME = os.environ.get('MONGO_DB_NAME', 'combat_stress_db')
COLLECTION_NAME = 'player_scores' # Coleção para armazenar as pontuações

client = None
db = None
try:
    client = MongoClient(MONGO_URI)
    # Testa a conexão para garantir que está funcionando
    client.admin.command('ping')
    db = client[DB_NAME]
    print(f"Conexão com MongoDB estabelecida para o banco de dados: {DB_NAME}")
except ConnectionFailure as e:
    print(f"ERRO: Falha ao conectar ao MongoDB: {e}")
    db = None # Garante que 'db' seja None se a conexão falhar
    # Em um ambiente de produção real, você pode querer lançar uma exceção
    # ou ter um tratamento de erro mais robusto aqui.

# --- Rotas do Aplicativo ---

@app.route('/')
def index():
    """Serve a página principal do jogo."""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve arquivos estáticos (CSS, JS)."""
    return send_from_directory('static', filename)

# Rotas de exemplo (mantidas, mas podem ser removidas se não usadas)
@app.route('/combat')
def combat():
    """Página de exemplo para combate."""
    return render_template('combat.html')

@app.route('/login')
def login():
    """Página de exemplo para login."""
    return render_template('login.html')

# --- NOVAS ROTAS DE API para Pontuações Compartilhadas ---

@app.route('/api/save_score', methods=['POST'])
def save_score():
    """Recebe a pontuação de um jogador do frontend e salva/atualiza no MongoDB.
    Se o jogador já existe, atualiza a pontuação total. Caso contrário, cria um novo.
    """
    if db is None:
        return jsonify({'message': 'Erro interno do servidor: Banco de dados não conectado.'}), 500

    data = request.get_json()
    if not data or 'name' not in data or 'score' not in data:
        return jsonify({'message': 'Dados inválidos. Requer um nome (name) e uma pontuação (score).'}), 400

    player_name = data['name']
    player_score = data['score']

    try:
        # Tenta encontrar o jogador pelo nome
        existing_player = db[COLLECTION_NAME].find_one({'name': player_name})

        if existing_player:
            # Se o jogador existe, atualiza a pontuação total
            new_total_score = existing_player.get('score', 0) + player_score
            db[COLLECTION_NAME].update_one(
                {'name': player_name},
                {'$set': {'score': new_total_score, 'timestamp': datetime.utcnow()}}
            )
            return jsonify({'message': 'Pontuação atualizada com sucesso!', 'name': player_name, 'score': new_total_score}), 200
        else:
            # Se o jogador não existe, cria um novo registro
            result = db[COLLECTION_NAME].insert_one({
                'name': player_name,
                'score': player_score,
                'timestamp': datetime.utcnow()
            })
            return jsonify({'message': 'Nova pontuação salva com sucesso!', 'id': str(result.inserted_id), 'name': player_name, 'score': player_score}), 201
    except Exception as e:
        print(f"Erro ao salvar/atualizar pontuação no MongoDB: {e}")
        return jsonify({'message': 'Erro interno ao salvar/atualizar a pontuação.'}), 500

@app.route('/api/get_scores', methods=['GET'])
def get_scores():
    """Retorna todas as pontuações salvas do MongoDB, ordenadas crescentemente pela pontuação (do mais negativo ao mais positivo)."""
    if db is None:
        return jsonify({'message': 'Erro interno do servidor: Banco de dados não conectado.'}), 500

    try:
        # Busca todas as pontuações e ordena por 'score' em ordem CRESCENTE (1)
        # Isso fará com que o maior número negativo (ex: -100) venha antes de um número negativo menor (ex: -10),
        # e antes dos números positivos.
        scores_cursor = db[COLLECTION_NAME].find({}, {'_id': 0}).sort('score', 1) # MUDANÇA AQUI: de -1 para 1
        scores_list = list(scores_cursor)
        return jsonify(scores_list), 200
    except Exception as e:
        print(f"Erro ao buscar pontuações do MongoDB: {e}")
        return jsonify({'message': 'Erro interno ao buscar as pontuações.'}), 500

@app.route('/api/reset_global_rank', methods=['POST'])
def reset_global_rank():
    """Apaga todas as pontuações da coleção no MongoDB (apenas para ADMIN)."""
    if db is None:
        return jsonify({'message': 'Erro interno do servidor: Banco de dados não conectado.'}), 500

    try:
        # Implementar autenticação de administrador aqui em uma aplicação real!
        # Por enquanto, apenas apaga a coleção.
        db[COLLECTION_NAME].delete_many({})
        return jsonify({'message': 'Rank GERAL resetado com sucesso!'}), 200
    except Exception as e:
        print(f"Erro ao resetar o Rank GERAL no MongoDB: {e}")
        return jsonify({'message': 'Erro interno ao resetar o Rank GERAL.'}), 500

@app.route('/api/delete_player_score/<string:player_name>', methods=['DELETE'])
def delete_player_score(player_name):
    """Exclui a pontuação de um jogador específico no MongoDB."""
    if db is None:
        return jsonify({'message': 'Erro interno do servidor: Banco de dados não conectado.'}), 500

    try:
        result = db[COLLECTION_NAME].delete_one({'name': player_name})
        if result.deleted_count > 0:
            return jsonify({'message': f'Pontuação de {player_name} removida com sucesso!'}), 200
        else:
            return jsonify({'message': f'Jogador {player_name} não encontrado.'}), 404
    except Exception as e:
        print(f"Erro ao deletar pontuação de {player_name} no MongoDB: {e}")
        return jsonify({'message': 'Erro interno ao deletar pontuação.'}), 500


# --- Inicialização do Aplicativo (para desenvolvimento local) ---
if __name__ == '__main__':
    print("Iniciando Flask em modo de desenvolvimento...")
    app.run(host='0.0.0.0', port=5000, debug=True)