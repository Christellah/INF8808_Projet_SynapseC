
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

            var collectNumb = parseInt(library["JEUNE"]);
            var empruntNumb = parseInt(d["Jeunes"].replace(",", ""));

            min_jeune.value = empruntNumb <= collectNumb ? empruntNumb : collectNumb;
            min_jeune.category = empruntNumb <= collectNumb ? "Emprunts" : "Inventaire";

            max_jeune.value = empruntNumb > collectNumb ? empruntNumb : collectNumb;
            max_jeune.category = empruntNumb > collectNumb ? "Emprunts" : "Inventaire";

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

            var collectNumb = parseInt(library["ADULTE"]);
            var empruntNumb = parseInt(d["Adultes"].replace(",", ""));
            
            min_adult.value = empruntNumb <= collectNumb ? empruntNumb : collectNumb;
            min_adult.category = empruntNumb <= collectNumb ? "Emprunts" : "Inventaire";

            max_adult.value = empruntNumb > collectNumb ? empruntNumb : collectNumb;
            max_adult.category = empruntNumb > collectNumb ? "Emprunts" : "Inventaire";

        }
    })

    adult.max = max_adult;
    adult.min = min_adult;
    // console.log(adult);
    return adult;
}

// Create a Connected Dot Plot for one library
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

    /***** Generate lollipops *****/
    // TODO : Move into function 
    var lineGenerator = d3.line();

    var lollipopLinePath = function(d) {
        // console.log(x("Adulte"));
        // return lineGenerator([[x("Jeune"), y(d.jeune.min.value)], [x("Jeune"), y(d.jeune.max.value)]]); 
        return lineGenerator([[x("Adulte"), y(d.adulte.min.value)], [x("Adulte"), y(d.adulte.max.value)]]); 
    };

    var lollipopsGroup = svg.append("g").attr("class", "lollipops");

    var lollipops = lollipopsGroup.selectAll("g")
    .data(libData)
    .enter().append("g")
    .attr("class", "lollipops")
    // .attr("transform", function(d) {
    //     console.log("TOTO")
    //     return "translate(0," + (x("Jeune") + (x.bandwidth() / 2)) + ")";
    // });

    lollipops.append("path")
    .attr("class", "lollipop-line")
    .attr("d", lollipopLinePath(libData));

    lollipops.append("circle")
    .attr("class", "lollipop-start")
    .attr("r", 5)
    .attr("cx", function(d) {
        return x("Adulte");
    })
    .attr("cy", function(d) {
        return y(d.adulte.min.value);
    });

    lollipops.append("circle")
    .attr("class", "lollipop-end")
    .attr("r", 5)
    .attr("cx", function(d) {
        return x("Adulte");
    })
    .attr("cy", function(d) {
        return y(d.adulte.max.value);
    });

}

/***** Axis domains  functions *****/
function domainX(x, libData) {
    return x.domain(["Jeune", "Adulte"]);
}

function domainY(y, libData) {
    return y.domain([0, Math.max(libData.jeune.max.value, libData.adulte.max.value)]);
    
}