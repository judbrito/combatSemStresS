import sqlite3
import json
from datetime import datetime

DATABASE = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def add_combat_to_history(ranking_data):
    conn = get_db_connection()
    cursor = conn.cursor()

    timestamp = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    print(f"Adicionando combate ao histórico em: {timestamp}")

    # Salva no histórico de combates
    cursor.execute(
        "INSERT INTO combat_history (timestamp, ranking_json) VALUES (?, ?)",
        (timestamp, json.dumps(ranking_data))
    )

    # Atualiza o ranking geral acumulado
    for player_data in ranking_data:
        player_name = player_data['name']
        player_score = player_data['score'] # Score já é o acumulado, mas será somado novamente

        # Ajuste: Se o score fornecido já é o acumulado, precisamos de uma forma de adicionar apenas os pontos *desta* rodada.
        # No seu sistema, `save_combat_results` faz `score = score + ?`.
        # Se você quer que o score fornecido seja o score *final* após esta rodada, e não o delta,
        # precisamos calcular a diferença em relação ao score atual no DB.
        # No entanto, a forma mais simples de reproduzir é simular o que o jogo faz: somar o score da rodada.
        # Como você forneceu o score final, vamos simular que este é o score *desta* rodada para que ele seja somado.
        # Isso pode levar a pontuações muito altas se você já tiver o histórico.
        # Para reproduzir o ranking *exatamente* como você forneceu como sendo o ranking final da rodada,
        # sem somar a valores pré-existentes, você teria que fazer um DELETE e INSERT ou UPDATE.
        # Vou assumir que você quer que esses sejam os *novos valores acumulados* para esses jogadores,
        # então o script vai atualizar o ranking global para esses valores, e não somar.

        # Consulta o score atual para calcular a diferença (se existir)
        cursor.execute("SELECT score FROM global_ranking WHERE name = ?", (player_name,))
        existing_score_row = cursor.fetchone()

        score_to_add_to_global = player_score # Este é o score que o jogador obteve nesta rodada

        # Se o jogador já existe, queremos adicionar o delta, não o total novamente.
        # Mas o seu `app.py` tem `score = score + ?`.
        # Se você quer definir o score GLOBAL para EXATAMENTE o que está na lista,
        # você precisaria de um UPDATE SET score = player_score
        # Para manter a lógica consistente com `app.py`, o score_to_add_to_global
        # deveria ser a *pontuação obtida NESTA RODADA*.
        # Como você deu os totais, vamos usar esses totais.
        # Vou adaptar para o seu cenário: o `player_score` abaixo será o *score da rodada*.
        # O sistema vai somar isso ao que já existe.
        # Se a intenção é que esses sejam os *novos totais*, a lógica seria diferente e sobrescreveria.
        # Dado o formato original do seu `app.py`, ele espera a pontuação da rodada.
        # Para simular isso, vamos supor que o "score" que você me deu é o score TOTAL FINAL de cada jogador.
        # Se você quer que este script *defina* o score global para estes valores:
        # Opção A: Definição Absoluta (IGNORA SCORES ANTERIORES NO GLOBAL, ATUALIZA PARA ESTE VALOR)
        cursor.execute(
            "INSERT INTO global_ranking (name, score) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET score = EXCLUDED.score",
            (player_name, player_score)
        )
        # Opção B: Adiciona o score ao total existente (COMO SE FOSSE A PONTUAÇÃO DESTA RODADA)
        # cursor.execute(
        #     "INSERT INTO global_ranking (name, score) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET score = score + ?",
        #     (player_name, player_score, player_score)
        # )
        # Vou usar a Opção A, pois parece que você quer que o ranking global reflita esses valores.
        # Se você quiser simular que esses são os pontos *ganhos* nesta rodada, use a Opção B.
        # Para reproduzir "como foi", o app.py envia o total acumulado, e o backend soma.
        # Para este script funcionar de forma isolada, definindo o estado, usaremos UPDATE SET.

        # NOVO AJUSTE: O app.py já espera a pontuação acumulada do jogador no `ranking` do POST.
        # No `app.py`, a linha `player_score = player_data['score']` pega o score *acumulado*.
        # E depois `score = score + ?` adiciona esse *acumulado* de novo. Isso é um erro no `app.py` se `player_data['score']`
        # já é o total acumulado. Aparentemente, o `app.py` espera o score *desta rodada* no `player_data['score']`.
        # Vamos simular o que o `app.py` faz, tratando o "score" que você deu como a pontuação *desta rodada*.
        # Isso pode inflar o ranking global se você rodar este script muitas vezes com os mesmos valores.

        # A forma mais precisa de "reproduzir" é usar os valores do ranking como pontuações *da rodada*.
        # Se os 72702 de NEWFLAME são o TOTAL, e não os pontos desta rodada, então a lógica seria:
        # 1. Obter o score ATUAL de NEWFLAME
        # 2. Calcular a diferença: 72702 - score_atual
        # 3. Adicionar a diferença.

        # Dada a complexidade e a sua lista, vou fazer uma suposição:
        # Os "scores" que você forneceu são os scores *finais para cada jogador* APÓS ESTA RODADA,
        # e você quer que o ranking global reflita esses valores, sobrescrevendo se necessário.
        # E que os "aviões" indicam quantos sobreviveram, mas não afetam o score aqui.

        cursor.execute(
            "INSERT INTO global_ranking (name, score) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET score = ?",
            (player_name, player_score, player_score)
        )

    conn.commit()
    conn.close()
    print("Combate adicionado com sucesso!")

if __name__ == "__main__":
    # Dados do ranking que você forneceu
    combat_ranking = [
        {"name": "NEWFLAME", "score": 72702, "airplanesAlive": 1},
        {"name": "Jader", "score": 63470, "airplanesAlive": 0},
        {"name": "\"DarkMage\"", "score": 63470, "airplanesAlive": 0},
        {"name": "Jean", "score": 61162, "airplanesAlive": 0},
        {"name": "Cahnrs", "score": 60008, "airplanesAlive": 0},
        {"name": "Lima", "score": 60008, "airplanesAlive": 0},
        {"name": "Sybeer", "score": 60008, "airplanesAlive": 0},
        {"name": "[M]ensia", "score": 56546, "airplanesAlive": 0},
        {"name": "Khalessi", "score": 55392, "airplanesAlive": 0},
        {"name": "Bala", "score": 54238, "airplanesAlive": 0},
        {"name": "Ziul", "score": 50776, "airplanesAlive": 0},
        {"name": "SYNGEX", "score": 48468, "airplanesAlive": 0},
        {"name": "Tsukombo", "score": 42698, "airplanesAlive": 0}
    ]

    # O app.py no front-end espera uma lista de players com "name" e "score".
    # As informações de "airplanesAlive" não são salvas no banco no seu esquema atual para o `combat_history`.
    # Se você quiser que "airplanesAlive" seja parte do histórico, você precisaria modificar a tabela `combat_history`
    # para salvar mais dados, ou incluir no JSON `ranking_json`.
    # Para o `save_combat_results` no app.py, ele espera `name` e `score`.
    # Vou manter apenas `name` e `score` no `ranking_json` como o app.py espera.

    # Ajuste a estrutura para o que o `ranking_json` realmente armazena: `name` e `score`.
    formatted_ranking = []
    for player in combat_ranking:
        formatted_ranking.append({"name": player["name"], "score": player["score"]})


    add_combat_to_history(formatted_ranking)

    # Você também pode verificar o ranking global após adicionar
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, score FROM global_ranking ORDER BY score DESC")
    global_rank = cursor.fetchall()
    conn.close()

    print("\nRanking Global Atualizado:")
    for row in global_rank:
        print(f"- {row['name']}: {row['score']}")