function set_graph(datas){
    d3.select("#myPlot").select("g").remove()

    const svg = d3.select("#myPlot")
    const data = structuredClone(datas)

     // temps des joueurs
     const div_temps = document.getElementById("b2");
     div_temps.innerHTML = "";
     const temps_tot_p = document.createElement("p");
     temps_tot_p.textContent = "Temps total avec joueur: "+data["temps_co_tot"]
     div_temps.appendChild(temps_tot_p)
     for (const [temps, player] of data["temps_co"]){
         var new_p = document.createElement("p");
         var new_a = document.createElement("a");
         new_a.href = "/inv?player="+player+"";
         new_a.text = player;
         new_a.classList = "btn item";
         new_p.appendChild(new_a);
         new_p.insertAdjacentText('beforeend', " : "+temps);
         div_temps.appendChild(new_p);
         }

    // Set Dimensions
    const margin = 40;
    const xSize = document.getElementById("b1").offsetWidth - 2 * margin;
    const ySize = document.getElementById("b1").offsetHeight - 4 * margin;

    console.log(xSize)

    const x_pos_list = []
    // set étiquette axe x
    var x_label_list = []
    for (let i=0; i<=24; i++){
        x_label_list.push(i+":00")
        x_pos_list.push(i*(1/24))
    }

    // Ajoute point pour graphique "carré"
    const lenght_data = data["points"].length
    for (var k in data["points"]){
        if (k < lenght_data-1){
            data["points"].splice(k*2+1, 0, {
                "aff_time": data["points"][k*2+1]["aff_time"],
                "online": data["points"][k*2]["online"], 
                "players": data["points"][k*2]["players"], 
                "time": data["points"][k*2+1]["time"]})
        }
    }

    // Add global <g>
    const g = svg
    .append("g")
    .attr("transform","translate(" + margin + "," + margin + ")");

    // add Axes
    const Axe_x = d3.scaleLinear().range([0, xSize]);
    const Axe_y = d3.scaleLinear().range([ySize, 0]).domain([0, 10]);

    g.append("g")
    .attr("transform", "translate(0," + ySize + ")")
    .call(d3.axisBottom(Axe_x).tickValues(x_pos_list).tickFormat(function(d, i){return x_label_list[i]}))
    .selectAll("text")
    .attr("transform", "rotate(-45)")  // Fait pivoter le texte de l'axe x de 90 degrés
    .attr("dx", "-2.25em")  // Ajuste la position du texte
    .attr("dy", "0.5em")
    .attr("fill", "white");

    g.append("g")
    .call(d3.axisLeft(Axe_y))
    .selectAll("text")
    .attr("fill", "white");

    // creation des points
    g.append('g')
    .selectAll("circle")
    .data(data["points"]).enter()
    .append("circle")
    .attr("cx", function (d) { return (d["time"]-data["points"][0]["time"])*xSize/86400 } )
    .attr("cy", function (d) { return ySize-d["players"].length*ySize/10 } )
    .attr("r", 2)
    .style("fill", function (d) {
        if (d["online"] == 1){return "white" }
        else {return "red" }
    })

    // creation des lignes
    g.append("g")
    .selectAll("line")
    .data(data["points"].slice(0, -1)).enter()
    .append("line")
    .attr("x1", function (d, i) { return (d["time"]-data["points"][0]["time"])*xSize/86400 })
    .attr("y1", function (d, i) { return ySize-d["players"].length*ySize/10 })
    .attr("x2", function (d, i) { return (data["points"][i+1]["time"]-data["points"][0]["time"])*xSize/86400 })
    .attr("y2", function (d, i) { return ySize-data["points"][i+1]["players"].length*ySize/10 })
    .style("stroke-width", 1)
    .style("stroke", function (d) {
        if (d["online"] == 1){return "white" }
        else {return "red" }
    })


}



function send_data(date){
    fetch('/data', {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify({"date": date})
    })
    .then(response => response.json())
    .then(data => {
        set_graph(data["data"])

        window.onresize = function(){
            set_graph(data["data"]);
        };
    })
}

send_data(date)

