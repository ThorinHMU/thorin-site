// Set Dimensions
const margin = 40;
const xSize = document.getElementById("b1").offsetWidth - 2 * margin;
const ySize = document.getElementById("b1").offsetHeight - 4 * margin;

const data = []
var nomsListe = [];
var positionsPersonnalisees = [];

// set la variable data
for (var usernam of usernames){
  
  data.push([usernam[0], [usernam[1][0], usernam[1][1]], usernam[2], usernam[3]])
}

// set étiquette axe x
for (let i=0; i<=24; i++){
  nomsListe.push(i+":00")
  positionsPersonnalisees.push(i*(1/24))
}

// compte nombre d'element de data
var lenght = 0;
for (var i in data) {
    lenght++;
}

if (1) {
    for (var test in data) {
        if (test < lenght-1) {
            data.splice(test * 2 +1, 0, [data[test*2][0], data[test*2+1][1], data[test*2][2], data[test*2][3]])
        }
    }
}

var lenght = 0;
for (var test in data) {
  lenght++;
 }



// Append SVG Object to the Page
const svg = d3.select("#myPlot")
  .append("g")
  .attr("transform","translate(" + margin + "," + margin + ")");


var formatNomAxeX = function(d, i) {
  return nomsListe[i];
};


// X Axis
const x = d3.scaleLinear()
  .range([0, xSize]);

svg.append("g")
  .attr("transform", "translate(0," + ySize + ")")
  .call(d3.axisBottom(x).tickValues(positionsPersonnalisees).tickFormat(formatNomAxeX))
  .selectAll("text")
  .attr("transform", "rotate(-45)")  // Fait pivoter le texte de l'axe x de 90 degrés
  .attr("dx", "-2.25em")  // Ajuste la position du texte
  .attr("dy", "0.5em")
  .attr("fill", "white");

// Y Axis
const y = d3.scaleLinear()
  .domain([0, 10])
  .range([ySize, 0]);

svg.append("g")
  .call(d3.axisLeft(y))
  .selectAll("text")
  .attr("fill", "white");

// Dots
svg.append('g')
  .selectAll("prout")
  .data(data).enter()
  .append("circle")
  .attr("cx", function (d) { return d[1][1]*xSize/86400 } )
  .attr("cy", function (d) { return ySize-d[2]*ySize/10 } )
  .attr("r", 2)
  .style("fill", function (d) {
    if (d[3] == 1){return "white" }
    else {return "red" }
  })

svg.append('g')
  .selectAll("dot")
  .data(data).enter()
  .append("circle")
  .attr("cx", function (d) { return d[1][1]*xSize/86400 } )
  .attr("cy", function (d) { return ySize-d[2]*ySize/10 } )
  .attr("r", 5)
  .style("opacity", "0")
  .on("mouseout", function(event) {
    tooltip.style("opacity", 1);
    tooltip.attr("x", 0)
        .attr("y", 0)
        .style("opacity", 1); // Rendre le texte visible
    tooltip.select("tspan:nth-child(1)")
            .text("")
    tooltip.select("tspan:nth-child(2)")
            .text("")
    fond.style("opacity", 1)
         .attr("width", 0)
        .attr("height", 0);
  })
  .on("mousemove", function(event) {
    // Obtenir les coordonnées de la souris par rapport au SVG
    var mouseX = d3.mouse(this)[0];
    var mouseY = d3.mouse(this)[1];
    var marge = 10

    // Mettre à jour la position du texte de l'infobulle à côté de la souris
    tooltip.attr("x", mouseX + 10)
        .attr("y", mouseY - 10)
        .style("opacity", 1); // Rendre le texte visible
    tooltip.select("tspan:nth-child(1)")
            .text(event[1][0].substr(11))
    tooltip.select("tspan:nth-child(2)")
            .text(event[0])

    var l1 = 0;
    var l2 = 0;
    var l3 = tooltip.select("tspan:nth-child(1)").node().getComputedTextLength();
    if (tooltip.select("tspan:nth-child(2)").node().getComputedTextLength() > tooltip.select("tspan:nth-child(1)").node().getComputedTextLength()){
    var l3 = tooltip.select("tspan:nth-child(2)").node().getComputedTextLength();
    }
    var l4 = 0;
    if (mouseX > 500){

    var l1 = tooltip.select("tspan:nth-child(1)").node().getComputedTextLength() + 2*marge;
    var l2 = tooltip.select("tspan:nth-child(2)").node().getComputedTextLength() + 2*marge;
    var l3 = tooltip.select("tspan:nth-child(2)").node().getComputedTextLength();
    var l4 = l2 - l1
    }

    tooltip.select("tspan:nth-child(1)")
            .attr("x", marge + mouseX - l1)
            .attr("y", mouseY-50)
    tooltip.select("tspan:nth-child(2)")
            .attr("x", marge + mouseX - l2)
            .attr("y", mouseY-30)
    fond.attr("x", marge + mouseX - l1 - l4)
        .attr("y", mouseY-50)
        .attr("width", l3)
        .attr("height", 50)
        .style("opacity", 1)


});;

for (let pas = 0; pas < lenght-1; pas++) {
svg.append('line')
    .style("stroke", function () {
    if (data[pas][3] == 1){return "white" }
    else {return "red" }
  })
    .style("stroke-width", 1)
    .attr("x1", function () { return data[pas][1][1]*xSize/86400 })
    .attr("y1", function () { return ySize-data[pas][2]*ySize/10 })
    .attr("x2", function () { return data[pas+1][1][1]*xSize/86400 })
    .attr("y2", function () { return ySize-data[pas+1][2]*ySize/10 });}

var fond = svg.append("rect")
    .style("fill", "var(--widget-blue)")

// Créer un élément texte pour afficher les informations à côté de la souris
var tooltip = svg.append("text")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("fill", "white");

tooltip.append("tspan")
    .attr("x", 10)
    .attr("dy", 20);

tooltip.append("tspan")
    .attr("x", 10)
    .attr("dy", 20);
