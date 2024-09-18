function find_points(intervalle, data){
    var inter_d = -1
    var inter_e = -1
    const l_data = data
    for (var k in l_data){
        if (l_data[k]["time"]-l_data[0]["time"] > intervalle[0] && inter_d == -1){
            inter_d = k - 1
        }
        if (l_data[k]["time"]-l_data[0]["time"] >= intervalle[1] && inter_d != -1 && inter_e == -1){
            inter_e = k - 1 
        }
        if (inter_e == -1 && k == l_data.length - 1){
            inter_e = l_data.length
        }
    }
    const new_data = structuredClone(l_data.slice(inter_d, inter_e + 1));
    new_data.at(0)["time"] = l_data.at(0)["time"] + intervalle[0];
    new_data.at(0)["aff_time"] = new Date(new_data.at(0)["time"]*1000).toLocaleTimeString();
    new_data.push(structuredClone(new_data.at(-1)))
    new_data.at(-1)["time"] = l_data.at(0)["time"] + intervalle[1];
    new_data.at(-1)["aff_time"] = new Date(new_data.at(-1)["time"]*1000).toLocaleTimeString();
    return new_data
}

function set_graph(datas){
    d3.select("#myPlot").select("g").remove()

    const svg = d3.select("#myPlot")
    const data = structuredClone(datas)
    const intervalle = [54000, 54300]

    const coef = intervalle[1] - intervalle[0]
    const t = coef/24/(coef >= 60 * 24 ? 60 : 1)
    const grandeur = Math.floor(Math.log10(Math.pow(10, Math.round(Math.log10(t)) / 10)) * -1);
    const pas = Math.round(Math.round(t/5, grandeur)*5, grandeur)*(coef >= 60 * 24 ? 60 : 1);
    const count_pas = Math.floor((coef-pas-1)/(pas))+1
    const fisrt_pas = Math.floor(intervalle[0]/pas)*pas + pas
    const data_p = find_points(intervalle, data["points"]);

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


    // set étiquette axe x
    const x_pos_list = []
    var x_label_list = []
    x_pos_list.push(0)
    x_label_list.push(new Date(intervalle[0]*1000-3600000).toLocaleTimeString())
    for (let i=1; i<=count_pas; i++){
        x_label_list.push(new Date((fisrt_pas+(i-1)*pas)*1000-3600000).toLocaleTimeString())
        x_pos_list.push(i*(1/(count_pas+1)))
    }
    x_pos_list.push(1)
    x_label_list.push(new Date(intervalle[1]*1000-3600000).toLocaleTimeString())

    // Ajoute point pour graphique "carré"
    const lenght_data = data_p.length
    for (var k in data_p){
        if (k < lenght_data-1){
            data_p.splice(k*2+1, 0, {
                "aff_time": data_p[k*2+1]["aff_time"],
                "online": data_p[k*2]["online"], 
                "players": data_p[k*2]["players"], 
                "time": data_p[k*2+1]["time"]})
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
    .attr("dx", "-2.5em")  // Ajuste la position du texte
    .attr("dy", "0.5em")
    .attr("fill", "white");

    g.append("g")
    .call(d3.axisLeft(Axe_y))
    .selectAll("text")
    .attr("fill", "white");

    // creation des points
    g.append('g')
    .selectAll("circle")
    .data(data_p).enter()
    .append("circle")
    .attr("cx", function (d) { return (d["time"]-data_p[0]["time"])*xSize/coef } )
    .attr("cy", function (d) { return ySize-d["players"].length*ySize/10 } )
    .attr("r", 2)
    .style("fill", function (d) {
        if (d["online"] == 1){return "white" }
        else {return "red" }
    })

    // creation des lignes
    g.append("g")
    .selectAll("line")
    .data(data_p.slice(0, -1)).enter()
    .append("line")
    .attr("x1", function (d, i) { return (d["time"]-data_p[0]["time"])*xSize/coef })
    .attr("y1", function (d, i) { return ySize-d["players"].length*ySize/10 })
    .attr("x2", function (d, i) { return (data_p[i+1]["time"]-data_p[0]["time"])*xSize/coef })
    .attr("y2", function (d, i) { return ySize-data_p[i+1]["players"].length*ySize/10 })
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

