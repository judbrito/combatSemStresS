import sqlite3
from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='static', template_folder='templates')
DATABASE = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # Permite acessar colunas como dicionário
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Tabela para o histórico de combates (resultados de cada rodada)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS combat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            ranking_json TEXT NOT NULL
        )
    ''')
    # Tabela para o ranking geral acumulado
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS global_ranking (
            name TEXT PRIMARY KEY,
            score INTEGER NOT NULL DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

# Inicializa o banco de dados quando o aplicativo Flask é iniciado
@app.before_request
def before_request():
    if not os.path.exists(DATABASE):
        init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save_combat_results', methods=['POST'])
def save_combat_results():
    data = request.json
    if not data or 'ranking' not in data:
        return jsonify({'status': 'error', 'message': 'Dados inválidos'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Salva no histórico de combates
    timestamp = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    cursor.execute(
        "INSERT INTO combat_history (timestamp, ranking_json) VALUES (?, ?)",
        (timestamp, json.dumps(data['ranking']))
    )

    # Atualiza o ranking geral acumulado
    for player_data in data['ranking']:
        player_name = player_data['name']
        player_score = player_data['score']
        cursor.execute(
            "INSERT INTO global_ranking (name, score) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET score = score + ?",
            (player_name, player_score, player_score)
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
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM combat_history")
    cursor.execute("DELETE FROM global_ranking")
    conn.commit()
    conn.close()
    # Recriar as tabelas se não existirem (garantir um estado limpo)
    init_db()
    return jsonify({'status': 'success', 'message': 'Dados apagados com sucesso!'})

if __name__ == '__main__':
    # Cria o diretório 'static' e 'templates' se não existirem
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    init_db() # Garante que o DB está inicializado na primeira execução
    app.run(debug=True) # debug=True para desenvolvimento (recarga automática)