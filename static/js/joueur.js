function get_stat(player){
    fetch("/get_stat_player", {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify({"player": player})
    })
    .then(response => response.json())
    .then(stat => {
        var div = document.getElementById("player-stat")
        var list_stat = Object.keys(stat["stats"])
        list_stat.forEach(state => {
            var p = document.createElement("p")
            p.textContent = state.replace("minecraft:", "") + " : " + stat["stats"][state]
            div.appendChild(p)
        });
    })
}

get_stat(document.location.href.split("/").at(-1))
