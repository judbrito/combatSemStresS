from flask import Flask, render_template, send_from_directory
import json
import os

app = Flask(__name__)

# Caminho para o arquivo game_data.json
GAME_DATA_FILE = 'game_data.json'

# Função para carregar dados do jogo (se necessário no futuro para persistência de servidor)
def load_game_data():
    if os.path.exists(GAME_DATA_FILE):
        with open(GAME_DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

# Função para salvar dados do jogo (se necessário no futuro para persistência de servidor)
def save_game_data(data):
    with open(GAME_DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

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

if __name__ == '__main__':
    # Cria o game_data.json se não existir (apenas como placeholder)
    if not os.path.exists(GAME_DATA_FILE):
        with open(GAME_DATA_FILE, 'w') as f:
            json.dump({}, f, indent=4) # Inicia com um JSON vazio
    
    # Você pode alterar o host e a porta conforme necessário para testes
    app.run(host='0.0.0.0', port=5000, debug=True)