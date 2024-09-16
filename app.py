import json
from bs4 import BeautifulSoup
from flask import Flask, render_template, request, session, url_for, send_file, redirect, jsonify
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
    print(request.args)
    return 'La fonction a été exécutée avec succès !'


@app.route('/')
def test():
    ancien = set()
    temps_users = {}
    temps_total = {"temps": 0, "new_co": 0}
    arguments = request.args

    jour_actuel = datetime.datetime.now()
    jour_actuel = [[jour_actuel.year, jour_actuel.month, jour_actuel.day],
                   [jour_actuel.hour, jour_actuel.minute, jour_actuel.second]]
    date_arg = arguments.get("date")

    if date_arg:
        date_arg = [int(i.lstrip("0")) for i in date_arg.split("-")]
        jour_actuel_stamp = datetime.datetime(*date_arg).timestamp().__int__()
    else:
        date_arg = jour_actuel[0].copy()
        return redirect(url_for(f"test",
                                date=f"{date_arg[0]}-{str(date_arg[1]).rjust(2, '0')}-{date_arg[2]}"))
    users = sql()

    users = sorted(users, key=lambda x: x["id"])

    users_test = []
    for index, i in enumerate(users):
        if datetime.datetime.fromtimestamp(int(i["time"])).date() == datetime.date(*date_arg):
            users_test.append(i)
            continue
        if index + 1 < len(users):
            if datetime.datetime.fromtimestamp(int(users[index+1]["time"])).date() == datetime.date(*date_arg):
                users_test.append(i)
                continue
        if index - 1 >= 0:
            if datetime.datetime.fromtimestamp(int(users[index-1]["time"])).date() == datetime.date(*date_arg):
                users_test.append(i)
                continue

    usernames = []
    first_time = 0

    for nbr, info_serv_select in enumerate(users):
        assert isinstance(info_serv_select, dict)

        list_players = eval(info_serv_select["players"])
        date = [f"{datetime.datetime.fromtimestamp(info_serv_select['time'])}",
                int(info_serv_select["time"]) - jour_actuel_stamp]
        nbr_players = len(eval(info_serv_select["players"]))
        online = int(info_serv_select["online"])

        date_datetime = datetime.datetime.fromtimestamp(info_serv_select["time"])

        # si le "user_s" corespond a la date selectioné sur le site
        if date_datetime.date() == datetime.date(date_arg[0], date_arg[1], date_arg[2]):

            if not first_time:
                first_time = info_serv_select["time"]

            # Nouveau se co
            for i in set(list_players) - ancien - {"", "Anonymous Player"}:
                if i not in temps_users.keys():
                    temps_users[i] = {"temps": 0, "temps_aff": ""}

                temps_users[i]["new_co"] = date[1]
            # Ancien se deco
            for i in ancien - set(list_players) - {"", "Anonymous Player"}:
                temps_users[i]["temps"] = temps_users[i]["temps"] + (date[1] - temps_users[i]["new_co"])
                temps_users[i]["temps_aff"] = f'{datetime.timedelta(seconds=temps_users[i]["temps"])}'

            if ancien == {''} != set(list_players):
                temps_total["new_co"] = date[1]
            elif ancien != {''} == set(list_players):
                temps_total["temps"] = temps_total["temps"] + date[1] - temps_total["new_co"]

            ancien = set(list_players)

            usernames.append([list_players, date, nbr_players, online])

    if usernames:
        if usernames[-1][2] > 0 and False:
            heure = [[date_arg[2], date_arg[1], date_arg[0]],
                     [23, 59, 59]]
            if date_arg == jour_actuel[0]:
                heure = [[jour_actuel[0][2], jour_actuel[0][1], jour_actuel[0][0]],
                         [jour_actuel[1][0], jour_actuel[1][1], jour_actuel[1][2]]]
            usernames.append([usernames[-1][0], [f"{usernames[-1][1][0][:10]} " + ":".join([str(i) for i in heure[1]]),
                                                 int(datetime.datetime(*[heure[0][2],
                                                                         heure[0][1],
                                                                         heure[0][0]] + heure[1]).timestamp())
                                                 - first_time if first_time else 0], usernames[-1][2],
                              usernames[-1][3]])
            for player in usernames[-1][0].split(" / "):
                temps_users[player]["temps"] = temps_users[player]["temps"] + (
                            int(datetime.datetime(*[heure[0][2], heure[0][1],
                                                    heure[0][0]] + heure[1]).timestamp() - first_time)
                            - temps_users[player]["new_co"])
                temps_users[player][
                    "temps_aff"] = f'{datetime.timedelta(seconds=temps_users[player]["temps"])}'
        last_time = usernames[-1][1][1] + first_time
        temp = last_time - first_time

    else:
        temp = 0
    return render_template('index.html', usernames=usernames, temp=temp, temps_user=temps_users,
                           stat=f'Stat du {date_arg[2]}/{date_arg[1]}/{date_arg[0]}',
                           temps_total=f'{datetime.timedelta(seconds=temps_total["temps"])}',
                           date=f"{date_arg[0]}-{date_arg[1]}-{date_arg[2]}")


@app.route('/inv')
def inv():
    argument = request.args
    player_select = argument.get("player")
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
    print("Inventaire de", nom)
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
                           nom=nom, date=date)


def calc_secondes(timestamp):
    time = datetime.datetime.fromtimestamp(timestamp).time()
    return datetime.timedelta(hours=time.hour, minutes=time.minute, seconds=time.second).total_seconds().__int__()


def count_time_player_co(player_name: str, data: list) -> int:
    if not data:
        return 0
    date = datetime.datetime.fromtimestamp(data[-1].get("time")).date()

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
        time += datetime.timedelta(hours=24).total_seconds().__int__() - last_time
    return time


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
    intervalle = data.get("intervalle")

    data_sql = sql()
    data_sql_fin = []
    data_send = {}

    liste_player = set()
    for k, i in enumerate(data_sql):
        sql_time = datetime.datetime.fromtimestamp(i.get("time"))
        if sql_time.date() == date:
            if not data_sql_fin:
                if k != 0:
                    time_0 = sql_time.replace(hour=0, minute=0, second=0)
                    data_0 = trans_data(data_sql[k-1])
                    data_0.update({"time": time_0.timestamp().__int__(), "aff_time": time_0.time().__str__()})
                    data_sql_fin.append(data_0)
                    liste_player = liste_player | set(eval(i.get("players")))
                else:
                    pass
            data_sql_fin.append(trans_data(i))
            liste_player = liste_player | set(eval(i.get("players")))

    if data_sql_fin and date == datetime.date.today():
        last = data_sql_fin[-1].copy()
        last["time"] = datetime.datetime.now().timestamp().__int__()
        last["aff_time"] = datetime.datetime.now().time().__str__()
        data_sql_fin.append(last)

    data_send.update({"points": data_sql_fin,
                      "temps_co": [(datetime.timedelta(seconds=count_time_player_co(player, data_sql_fin)).__str__(),
                                    player) for player in liste_player],
                      "temps_co_tot": datetime.timedelta(seconds=count_time_player_co("*",
                                                                                      data_sql_fin)).__str__()})
    for i in data_sql_fin:
        print(i, datetime.datetime.fromtimestamp(i.get("time")).time())
    print([(datetime.timedelta(seconds=count_time_player_co(player, data_sql_fin)).__str__(), player)
           for player in liste_player])
    print(datetime.timedelta(seconds=count_time_player_co("*", data_sql_fin)).__str__())

    return jsonify({'data': data_send})
