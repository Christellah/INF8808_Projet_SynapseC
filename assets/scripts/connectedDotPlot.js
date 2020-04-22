
function createConnectedDotPlotSources(collectionLivres, pretsPublic) {

    var publicSources = [];

    for (const year in collectionLivres) {
        var perYear = [];
        var year_string = new Object();
        year_string.annee = year;
        perYear.push(year_string);

        collectionLivres[year].forEach(function (d, i) {
            
            var library = new Object();
            library.bibliotheque = d["BIBLIOTHÈQUE"];
            // console.log(d["ADULTE"])
            // console.log(d["JEUNE"])

            var jeune = findMinMaxJeune(year, d, collectionLivres, pretsPublic);
            library.jeune  = jeune; 

            var adult = findMinMaxAdult(year, d, collectionLivres, pretsPublic);
            library.adulte = adult; 

            perYear.push(library);
        })
        publicSources.push(perYear)
    };

    // console.log(publicSources);

    return publicSources;
}


function findMinMaxJeune(year, library, collectionLivres, pretsPublic) {
    var jeune = new Object();

    var max_jeune = new Object();
    max_jeune.value = 0;
    max_jeune.category = 0;

    var min_jeune = new Object();
    min_jeune.value = 0;
    min_jeune.category = 0;

    pretsPublic[year].forEach(function (d, i) {
        if(d["BIBLIOTHÈQUE"] == library["BIBLIOTHÈQUE"]) {

            min_jeune.value = d["Jeunes"] <= library["JEUNE"] ? d["Jeunes"] : library["JEUNE"];
            min_jeune.category = d["Jeunes"] <= library["JEUNE"] ? "Emprunts" : "Inventaire";

            max_jeune.value = d["Jeunes"] > library["JEUNE"] ? d["Jeunes"] : library["JEUNE"];
            max_jeune.category = d["Jeunes"] > library["JEUNE"] ? "Emprunts" : "Inventaire";

        }
    })

    jeune.max = max_jeune;
    jeune.min = min_jeune;
    // console.log(jeune);
    return jeune;
}

function findMinMaxAdult(year, library, collectionLivres, pretsPublic) {
    var adult = new Object();

    var max_adult = new Object();
    max_adult.value = 0;
    max_adult.category = 0;

    var min_adult = new Object();
    min_adult.value = 0;
    min_adult.category = 0;

    pretsPublic[year].forEach(function (d, i) {
        if(d["BIBLIOTHÈQUE"] == library["BIBLIOTHÈQUE"]) {

            min_adult.value = d["Adultes"] <= library["ADULTE"] ? d["Adultes"] : library["ADULTE"];
            min_adult.category = d["Adultes"] <= library["ADULTE"] ? "Emprunts" : "Inventaire";

            max_adult.value = d["Adultes"] > library["ADULTE"] ? d["Adultes"] : library["ADULTE"];
            max_adult.category = d["Adultes"] > library["ADULTE"] ? "Emprunts" : "Inventaire";

        }
    })

    adult.max = max_adult;
    adult.min = min_adult;
    // console.log(adult);
    return adult;
}

// Create a Connected Dot Plot for one library
/*function createConnectedDotPlot(data) {
    var libData = data[1];
    console.log(libData.jeune.max.value);
    // source : https://www.enigma.com/blog/post/analyzing-public-data-with-d3 
    var margin = {top: 100, right: 100, bottom: 100, left: 100},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var svg = d3.select("#ConnectedDotPlot").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var y = d3.scaleLinear()
    .range([height, 0]);
    
    var x = d3.scaleBand()
      .range([0, width]);
    
    var lineGenerator = d3.line();
    
    var lollipopLinePath = function(d) {
      return lineGenerator([[x(d.min), 0], [x(d.max), 0]]); 
    }


    // Axis x and y domains
    x.domain(["Jeune", "Adulte"]);
    y.domain([0, Math.max(libData.jeune.max.value, libData.adulte.max.value)]);
    // y.nice();

    var yAxis = d3.axisLeft().scale(y)
    .tickSize(0);

    var xAxis = d3.axisBottom().scale(x)
    .tickSize(0);

    // var xAxis = d3.axisTop().scale(x)
    // .tickFormat(function(d,i) {
    // if (i == 0) {
    //     return "$0"
    // } else {
    //     return d3.format(".2s")(d);
    // }
    // });

    var yAxisGroup = svg.append("g")
    .attr("class", "y-axis-group");

    yAxisGroup.append("g")
    .attr("class", "y-axis")
    .call(yAxis)
    .select(".domain")
    .attr("opacity", 1);

    var xAxisGroup = svg.append("g")
    .attr("class", "x-axis-group");

    xAxisGroup.append("g")
    .attr("class", "x-axis")
    .call(xAxis);

    let lollipopsGroup = svg.append("g").attr("class", "lollipops");

    let lollipops = lollipopsGroup.selectAll("g")
    .data(libData)
    .enter().append("g")
    .attr("class", "lollipop")
    .attr("transform", function(d) {
        return "translate(0," + (y(d.name) + (y.bandwidth() / 2)) + ")";
    });

    lollipops.append("path")
    .attr("class", "lollipop-line")
    .attr("d", lollipopLinePath);

    let startCircles = lollipops.append("circle")
    .attr("class", "lollipop-start")
    .attr("r", 5)
    .attr("cx", function(d) {
    return x(d.min);
    });

    let endCircles = lollipops.append("circle")
    .attr("class", "lollipop-end")
    .attr("r", 5)
    .attr("cx", function(d) {
    return x(d.max);
    });
}*/


function createLibConnectedDotPlot(libData) {
    var margin = {
        top: 10,
        right: 10,
        bottom: 100,
        left: 60
    };

    var width = 300 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

     /***** Scales *****/
    var x = d3.scaleBand().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // var xAxis = d3.axisBottom(x).tickFormat(0);
    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y);


    /***** Create Elements *****/
    var svg = d3.select("#ConnectedDotPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

    var graph = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /***** Axis domains *****/
    domainX(x, libData);
    domainY(y, libData);

    /***** Append Axis *****/
    graph.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    graph.append("g")
      .attr("class", "y axis")
      .call(yAxis);
}

/***** Axis domains  functions *****/
function domainX(x, libData) {
    return x.domain(["Jeune", "Adulte"]);
}

function domainY(y, libData) {
    return y.domain([0, Math.max(libData.jeune.max.value, libData.adulte.max.value)]);
    
}