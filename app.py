import json
from bs4 import BeautifulSoup
from flask import Flask, render_template, request, session, url_for, send_file, redirect, jsonify, send_from_directory
import mysql.connector
import datetime
from config import host, port, user, password, database, apkey
import requests
from nbt import nbt
import gzip
from io import BytesIO
from enchant import enchant
app = Flask(__name__)
application = app
app.secret_key = "05f13cee9a270bbb6467039508232f38531b3ec6db04b16c6c80ac5b225cec4b"


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(
        app.static_folder, 'img/assets/favicon.ico', mimetype='image/vnd.microsoft.icon'
    )


def sql():
    cursor = None
    connection = None
    try:
        connection = mysql.connector.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )

        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM stat")
        result = cursor.fetchall()

        return result

    except mysql.connector.Error as err:
        print(f"Erreur MySQL : {err}")

    finally:
        # Fermer le curseur et la connexion
        if 'cursor' in locals() and cursor is not None:
            cursor.close()

        if 'connection' in locals() and connection.is_connected():
            connection.close()
            print("Connexion MySQL fermee")


def mv_inv(uuid):
    url = f'https://game.hosterfy.com/api/client/servers/6c43749e/files/contents?file=world/playerdata/{uuid}.dat'
    headers = {
        "Authorization": f"Bearer {apkey}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    response = requests.request('GET', url, headers=headers)
    if response.status_code == 500:
        return None
    response.raise_for_status()
    decompress_file = gzip.decompress(response.content)
    file = nbt.NBTFile(buffer=BytesIO(decompress_file))
    return file


@app.route("/enchante/<img>")
def enchante(img):
    return send_file(enchant(img), mimetype='image/png')


@app.route('/retour', methods=['POST'])
def retour():
    return 'La fonction a été exécutée avec succès !'


@app.route("/")
def princ():
    return render_template("accueil.html", active_page='accueil')


@app.route('/stat')
def test():
    arguments = request.args

    jour_actuel = datetime.datetime.now()
    jour_actuel = [[jour_actuel.year, jour_actuel.month, jour_actuel.day],
                   [jour_actuel.hour, jour_actuel.minute, jour_actuel.second]]
    date_arg = arguments.get("date")

    if date_arg:
        date_arg = [int(i.lstrip("0")) for i in date_arg.split("-")]
    else:
        date_arg = jour_actuel[0].copy()

    return render_template('index.html', date=f"{date_arg[0]}-{date_arg[1]}-{date_arg[2]}",
                           active_page='stat')


@app.route("/inv")
def joueurs():
    url = f"https://game.hosterfy.com/api/client/servers/6c43749e/files/contents?file=usercache.json"
    headers = {
        "Authorization": f"Bearer {apkey}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    response = requests.request(url=url, method="GET", headers=headers)
    players = [i["name"] for i in response.json()]

    return render_template("joueurs.html", players=players, active_page='joueurs')


@app.route("/get_players", methods=["POST"])
def get_players():
    url = f"https://game.hosterfy.com/api/client/servers/6c43749e/files/contents?file=usercache.json"
    headers = {
        "Authorization": f"Bearer {apkey}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    response = requests.request(url=url, method="GET", headers=headers)
    players = list({(i["name"], f"https://mineskin.eu/avatar/{i["name"]}/16.png"
                    if i["name"].replace("_", "").isalnum()
                    else f"https://mineskin.eu/avatar/_/16.png") for i in response.json()})
    players = list(sorted(players, key=lambda x: [i["name"] for i in response.json()].index(x[0])))
    return jsonify({"players": players})


@app.route("/get_stat_player", methods=["POST"])
def get_stat_player():
    print("okk")
    argument = request.json
    print(argument)
    player = argument.get("player")
    print(player)
    url = f"https://game.hosterfy.com/api/client/servers/6c43749e/files/contents?file=usercache.json"
    headers = {
        "Authorization": f"Bearer {apkey}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    response = requests.request(url=url, method="GET", headers=headers)
    uuid = [i["uuid"] for i in response.json() if i["name"] == player][0]
    url = f"https://game.hosterfy.com/api/client/servers/6c43749e/files/contents?file=world/stats/{uuid}.json"
    response = requests.get(url, headers=headers)
    print(response.json()["stats"]["minecraft:custom"])
    return jsonify({"stats": response.json()["stats"]["minecraft:custom"]})


@app.route('/inv/<player>')
def inv(player):
    argument = request.args
    player_select = player
    date = argument.get("date")
    if not date:
        date = datetime.date.today()
        date = f"{date.year}-{date.month}-{date.day}"
    url = f"https://game.hosterfy.com/api/client/servers/6c43749e/files/contents?file=usercache.json"
    headers = {
        "Authorization": f"Bearer {apkey}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    response = requests.request(url=url, method="GET", headers=headers)
    uuid = [i["uuid"] for i in response.json() if i["name"] == player_select][0]
    file = mv_inv(uuid)
    if not file:
        return "Joueur Non trouvé"
    nom = str(file.get("bukkit").get("lastKnownName"))
    if nom.replace("_", "").isalnum():
        url = f"https://mineskin.eu/armor/body/{nom}/100.png"
    else:
        url = f"https://mineskin.eu/armor/body/_/100.png"

    skin_url = url
    inventaire = []
    for i in file.get("Inventory"):
        enchantes = i.get("components")
        if enchantes:
            enchantes = i.get("components").get("minecraft:enchantments")
        a = i.get("Slot")
        assert isinstance(a, nbt.TAG_Byte)
        inventaire.append([i.get("id").__str__().replace("minecraft:", ""), a.value.__int__(),
                           str(i.get("count")), enchantes is not None])

    return render_template("Inventaire.html", skin_url=skin_url, inv=json.dumps(inventaire),
                           nom=nom, date=date, active_page='joueurs')


def calc_secondes(timestamp):
    time = datetime.datetime.fromtimestamp(timestamp).time()
    return int(datetime.timedelta(hours=time.hour, minutes=time.minute, seconds=time.second).total_seconds())


def count_time_player_co(player_name: str, data: list) -> int:
    if not data:
        return 0
    date = datetime.datetime.fromtimestamp(data[0].get("time")).date()

    time = 0
    last_time = 0
    for i in data:
        tot_seconde = calc_secondes(i.get("time")) \
            if datetime.datetime.fromtimestamp(i.get('time')).date() == date \
            else 0
        if player_name in i.get("players") or (player_name == "*" and i.get("players")):
            if not last_time:
                last_time = tot_seconde
        else:
            if last_time:
                time += tot_seconde - last_time
                last_time = 0
    if last_time:
        d_time = datetime.datetime.fromtimestamp(data[-1].get("time")).time()
        time += datetime.timedelta(hours=d_time.hour,
                                   minutes=d_time.minute,
                                   seconds=d_time.second).total_seconds().__int__() - last_time
    return time


@app.route("/temps", methods=["POST"])
def count_time_players_co():
    data: dict = request.json
    data: list[dict] = data.get("data")
    liste_players = set()
    for i in data:
        liste_players = liste_players | set(i.get("players"))
    times = sorted(
        [(str(datetime.datetime.fromtimestamp(count_time_player_co(player, data),
                                              datetime.timezone.utc).time()), player) for player in liste_players],
        key=lambda x: count_time_player_co(x[1], data)*-1)
    time_tot = str(datetime.datetime.fromtimestamp(count_time_player_co("*", data), datetime.timezone.utc).time())

    return jsonify({"temps": {"temps_co": times, "temps_co_tot": time_tot}})


def trans_data(data):
    data.update({"aff_time": datetime.datetime.fromtimestamp(data["time"]).time().__str__()})
    data_fin = {key: data[key] for key in ["online", "time", "players", "aff_time"]}
    data_fin["players"] = eval(data_fin["players"])
    return data_fin


@app.route("/data", methods=["POST"])
def data_co():
    # Récuperation des donnes d'entrées
    data: dict = request.json
    date = datetime.date(*[int(i) for i in data.get("date").split("-")]) if data.get("date") else datetime.date.today()

    data_sql = sql()
    data_sql_fin = []
    data_send = {}

    for k, i in enumerate(data_sql):
        sql_time = datetime.datetime.fromtimestamp(i.get("time"))
        if sql_time.date() == date:
            if not data_sql_fin:
                if k != 0:
                    time_0 = sql_time.replace(hour=0, minute=0, second=0)
                    data_0 = trans_data(data_sql[k-1])
                    data_0.update({"time": time_0.timestamp().__int__(), "aff_time": time_0.time().__str__()})
                    data_sql_fin.append(data_0)
                else:
                    pass
            data_sql_fin.append(trans_data(i))

    if not data_sql_fin:
        sql_time = datetime.datetime.fromtimestamp(data_sql[-1].get("time"))
        time_0 = sql_time.replace(year=date.year, month=date.month, day=date.day, hour=0, minute=0, second=0)
        data_0 = trans_data(data_sql[-1])
        data_0.update({"time": time_0.timestamp().__int__(), "aff_time": time_0.time().__str__()})
        data_sql_fin.append(data_0)

    if data_sql_fin and date == datetime.date.today():
        last = data_sql_fin[-1].copy()
        last["time"] = datetime.datetime.now().timestamp().__int__()
        last["aff_time"] = datetime.datetime.now().time().strftime("%H:%M:%S")
        data_sql_fin.append(last)

    data_send.update({"points": data_sql_fin})

    return jsonify({'data': data_send})
