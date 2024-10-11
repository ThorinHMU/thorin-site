document.addEventListener("DOMContentLoaded", function() {
    // Masquer la page avant le chargement
    document.getElementById("player-stat").style.display = "none";

    // Fonction pour récupérer les statistiques
    function get_stat(player) {
        fetch("/get_stat_player", {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify({"player": player})
        })
        .then(response => response.json())
        .then(stat => {
            var div = document.getElementById("player-stat");
            var list_stat = Object.keys(stat["stats"]);
            list_stat.forEach(state => {
                var p = document.createElement("p");
                p.textContent = state.replace("minecraft:", "") + " : " + stat["stats"][state];
                div.appendChild(p);
            });

            // Afficher la page une fois que les statistiques sont prêtes
            document.getElementById("player-stat").style.display = "grid";
        });
    }

    // Appeler la fonction get_stat avec le dernier segment de l'URL (le nom du joueur)
    get_stat(document.location.href.split("/").at(-1));
});
