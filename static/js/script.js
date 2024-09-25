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
    if (new_data.length){
    new_data.at(0)["time"] = l_data.at(0)["time"] + intervalle[0];
    new_data.at(0)["aff_time"] = new Date(new_data.at(0)["time"]*1000).toLocaleTimeString();
    new_data.push(structuredClone(new_data.at(-1)))
    if (intervalle[1] < structuredClone(l_data).at(-1)["time"] - l_data.at(0)["time"] || new Date(l_data.at(-1)["time"]*1000).toLocaleDateString() != new Date().toLocaleDateString()){
        new_data.at(-1)["time"] = l_data.at(0)["time"] + intervalle[1];
        new_data.at(-1)["aff_time"] = new Date(new_data.at(-1)["time"]*1000).toLocaleTimeString();
    }
    }
    return new_data
}

function set_info(data, x){
    const div = d3.select("#info-list");
    const p  = div.select("p");

    for (var point in data){
        var time1 = data[point]["time"] - data[0]["time"]
        var time2 = data[(point > 0 ? point-1 : 0)]["time"] - data[0]["time"]
        if (time1>= x){
            const heure1 = new Date((time2-3600)*1000).toLocaleTimeString()
            const heure2 = new Date((time1-3600)*1000).toLocaleTimeString()
            nbr_player = data[(point > 0 ? point-1 : 0)]["players"]
            p.text("de "+ heure1 + " a " + heure2 + " pendant " + (new Date((time1-time2-3600)*1000).toLocaleTimeString()) + " avec " + nbr_player.length + " joueur(s): " + nbr_player.join(" / "))
            return
        }
    }

    p.text("")
}

async function players_time(data){
    return fetch('/temps', {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify({"data": data})
    })
    .then(response => response.json())
    .then(data_temps => {
        data_temps = data_temps["temps"]
        const div_temps = document.getElementById("b2");
        div_temps.innerHTML = "";

        const temps_tot_p = document.createElement("p");
        temps_tot_p.textContent = "Temps total avec joueur: " + data_temps["temps_co_tot"]
        div_temps.appendChild(temps_tot_p)
        
        for (const [temps, player] of data_temps["temps_co"]){
            var new_p = document.createElement("p");
            var new_a = document.createElement("a");
            new_a.href = "/inv?player="+player+"";
            new_a.text = player;
            new_a.classList = "btn item";
            new_p.appendChild(new_a);
            new_p.insertAdjacentText('beforeend', " : "+temps);
            div_temps.appendChild(new_p);
        }
    })
}

function aff_graph(data, intervalle, coef, svg, xSize, ySize, margin){
    
    const pas = Math.round(coef/24);
    const count_pas = 23
    const fisrt_pas = intervalle[0]+ pas

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
    const lenght_data = data.length
    for (var k in data){
        if (k < lenght_data-1){
            data.splice(k*2+1, 0, {
                "aff_time": data[k*2+1]["aff_time"],
                "online": data[k*2]["online"], 
                "players": data[k*2]["players"], 
                "time": data[k*2+1]["time"]})
        }
    }

    // Add global <g>
    const g = svg
    .append("g")
    .attr("transform","translate(" + margin + "," + margin + ")")
    .attr("id", "my_g")

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
    .data(data).enter()
    .append("circle")
    .attr("cx", function (d) { return (d["time"]-data[0]["time"])*xSize/coef } )
    .attr("cy", function (d) { return ySize-d["players"].length*ySize/10 } )
    .attr("r", 2)
    .style("fill", function (d) {
        if (d["online"] == 1){return "white" }
        else {return "red" }
    });

    // creation des lignes
    g.append("g")
    .selectAll("line")
    .data(data.slice(0, -1)).enter()
    .append("line")
    .attr("x1", function (d, i) { return (d["time"]-data[0]["time"])*xSize/coef })
    .attr("y1", function (d, i) { return ySize-d["players"].length*ySize/10 })
    .attr("x2", function (d, i) { return (data[i+1]["time"]-data[0]["time"])*xSize/coef })
    .attr("y2", function (d, i) { return ySize-data[i+1]["players"].length*ySize/10 })
    .style("stroke-width", 1)
    .style("stroke", function (d) {
        if (d["online"] == 1){return "white" }
        else {return "red" }
    });
    // creation du rect de selection
    g.append("rect")
            .style("fill", "rgb(100, 100, 100, 0.5)")
            .style("height", ySize)
            .style("width", "2px")
            .attr("id", "slc")
            .style("visibility", "hidden");
    
    // creation du rect pour detecter la souris
    g.append("rect")
        .style("fill", "#00000000")
        .style("height", ySize)
        .style("width", xSize)
        .attr("id", "capteur");
}

function set_event(data, coef, xSize, intervalle){
    // detecter la souris
    const mydiv = document.getElementById("capteur");
    const mysvg = document.getElementById("myPlot");
    const slc = document.getElementById("slc");
    const rect = mydiv.getBoundingClientRect();
    var x = null;

    function calc_pos(pos, xSize){
        return (pos >= 0 ? (pos <= xSize ? pos : xSize) : 0)
    }

    mysvg.addEventListener("mouseenter", function(){
        slc.style.visibility = "";
    })

    mysvg.addEventListener("mouseleave", function(){
        slc.style.visibility = "hidden";
        slc.style.width = "2px";
        x = null;

        d3.select("#info-list").select("p").text("")
    })

    mysvg.addEventListener("mousedown", function(event){
        if (event.button==0){
            x = calc_pos(event.clientX - rect.left, xSize);
        }
    })

    mysvg.addEventListener("mouseup", function(event){
        var pos_1 = Math.round(calc_pos(event.clientX - rect.left, xSize)/xSize*coef)+intervalle[0]
        var pos_2 = Math.round((x)/xSize*coef)+intervalle[0]
        var pos_min = Math.min(pos_1, pos_2)
        var pos_max = Math.max(pos_1, pos_2)
        
        if (pos_min+24 > pos_max && pos_max > pos_min){
            pos_max = pos_min + 24
        }
        if (x != null && pos_min != pos_max){
            set_graph(data, [pos_min, pos_max])
        }
        
        x = null;
        slc.style.width = "2px";
    })
    
    mysvg.addEventListener("contextmenu", function(e){
        e.preventDefault();
    })
    
    mysvg.addEventListener("mousemove", function(event) {

        if (event.buttons != 1){
            x = null;
            slc.style.width = "2px";
        }
        const pos = (event.clientX - rect.left);
        set_info(find_points([0, 86399], data["points"]), Math.round(calc_pos(event.clientX - rect.left, xSize)/xSize*coef)+intervalle[0]);
        
        if (x == null){
            slc.setAttribute("x", calc_pos(pos, xSize))
        } else if(calc_pos(pos, xSize) - x > 1) {
            slc.style.width = calc_pos(pos, xSize) - x;
        }else if(calc_pos(pos, xSize) - x < 1){
            slc.style.width = x - calc_pos(pos, xSize);
            slc.setAttribute("x", calc_pos(pos, xSize));
        } else {
            slc.style.width = "2px";
        }
    });

    // set action button
    window.onresize = function(){
        set_graph(data, intervalle);
    };
}

function set_graph(datas, intervalle=[0, 86399]){
    const data = find_points(intervalle, structuredClone(datas["points"]))
    players_time(data).then(() => {
        
        // Set Dimensions
        document.getElementById("myPlot").remove()
        document.getElementById("info-list").remove()
        const svg = d3.select("#b1").append("svg").attr("id", "myPlot")
        const info = d3.select("#b1")
                    .append("div")
                    .attr("id", "info-list")
                    .style("height", "50px")
                    .style("margin-left", "40px");
        info.append("p")

        const margin = 50;
        const xSize = document.getElementById("b1").offsetWidth - 2 * margin;
        const ySize = Number(getComputedStyle(document.getElementById("myPlot")).height.slice(0, 3)) - 2 * margin - 15;
        const coef = intervalle[1] - intervalle[0]
        d3.select("#info-list").style("width", xSize + "px")
        
        //appel function
        aff_graph(data, intervalle, coef, svg, xSize, ySize, margin)
        set_event(datas, coef, xSize, intervalle)
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
        document.getElementById("dezoom_graph").addEventListener("click", function(){
            set_graph(data["data"]);
        })
    })
}

send_data(date)

