function aff_players_list(){
    const div_players = document.getElementById("list-joueur")
    fetch("/get_players", {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        }
    }).then(response => response.json())
    .then(players => {
        players = players["players"]
        players.forEach(player => {
            var li = document.createElement("li");
            var a = document.createElement("a");
            var img = document.createElement("img");
            a.setAttribute("href", "/inv/" + player[0])
            a.textContent = " " + player[0];

            img.setAttribute("src", player[1])

            li.appendChild(img);
            li.appendChild(a);
            div_players.appendChild(li);
        });
    })

}   

aff_players_list()