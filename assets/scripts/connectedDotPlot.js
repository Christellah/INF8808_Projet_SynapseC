
/***** ConnectedDotPlot Class  *****/

ConnectedDotPlot = class ConnectedDotPlot {
    constructor(data) {
        this.data = data
    };

    // Create a Connected Dot Plot for one library
    createLibConnectedDotPlot(data, year, libName) {

        var libData = [];
        data.forEach(function(d) {
            if(d.year == year) {
                var lib = d.libraries;
                lib.forEach(function(e) {
                    if(e.name == libName) {
                        libData = e.public;
                    }
                });
            }
        });

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
        this.domainX(x, libData);
        this.domainY(y, libData);

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
            return lineGenerator([[x(d.name) + (x.bandwidth() / 2) , y(d.min)], [x(d.name) + (x.bandwidth() / 2), y(d.max)]]); 
        };

        var lollipopsGroup = graph.append("g").attr("class", "lollipops");

        var lollipops = lollipopsGroup.selectAll("g")
        .data(libData)
        .enter().append("g")
        .attr("class", "lollipop")

        lollipops.append("path")
        .attr("class", "lollipop-line")
        .attr("d", lollipopLinePath);

        lollipops.append("circle")
        .attr("class", "lollipop-start")
        .attr("r", 5)
        .attr("cx", function(d) {
            return x(d.name) + (x.bandwidth() / 2);
        })
        .attr("cy", function(d) {
            return y(d.min);
        });

        lollipops.append("circle")
        .attr("class", "lollipop-end")
        .attr("r", 5)
        .attr("cx", function(d) {
            return x(d.name) + (x.bandwidth() / 2);
        })
        .attr("cy", function(d) {
            return y(d.max);
        });

    }

    /***** Axis domains  functions *****/
    domainX(x, libData) {
        return x.domain(libData.map(function(d) { return d.name }));
    }

    domainY(y, libData) {
        return y.domain([0, Math.max(libData[0].max, libData[1].max)]);
    }

    createYearDropDown(data) {
        var svg = d3.select("#ConnectedDotPlot")
        var value = "";
        var dropdown = svg.insert("select", "svg")
                    .on("change", function() {
                        value = this.value;
                        console.log(value);
                        ConnectedDotPlot.updateDataYear(data, value);
                    });

        dropdown.selectAll("option")
            .data(data)
            .enter().append("option")
            .attr("value", function (d) { 
                return d.year; })
            .text(function (d) {
                return d.year; 
            });

        this.createLibraryDropDown(data, data[0].year);

        return dropdown;
    };

    createLibraryDropDown(data, year) {
        var librariesNames = [];

        data.forEach(function(c) {
            if(c.year == year) {
                c.libraries.forEach(function(d) {
                    librariesNames.push({"name" : d.name});
                })
            }
        })

        console.log(librariesNames);

        var svg = d3.select("#ConnectedDotPlot")
        var dropdown = svg.insert("select", "svg")
                    .on("change", this.updateDataLibrary);

        dropdown.selectAll("option")
            .data(librariesNames)
            .enter().append("option")
            .attr("value", function (d) { 
                return d.name;
            })
            .text(function (d) {
                return d.name; 
            });
        
        // Take the last year data as the initial data 
        var initialData = data[data.length - 1];
        this.createLibConnectedDotPlot(data, initialData.year, initialData.libraries[0].name);

    };
    
    
    /***** Year selection function *****/
    // This update the library dropdown list
    
    static updateDataYear(data, year){
        var librariesNames = [];

        data.forEach(function(c) {
            if(c.year == year) {
                c.libraries.forEach(function(d) {
                    librariesNames.push({"name" : d.name});
                });
            };
        });


        // return librariesNames;
    };

    /***** Library selection function *****/
    static updateDataLibrary(data, newData) {
    }

}

/**
 * Transforme les données d'emprunts à partir des données json.
 * Format de retour :
 * [
 *     {
 *              "year " : 2018,
 *              "librairies" : [ 
 *                 {"name" : "(AHC) ",
 *                 public : [ {
 *                          "name" : "Jeune",
 *                          "min" : 25566,
 *                          "max" : 98765,
 *                          },
 *                          {
 *                          "name" : "Adulte",
 *                          "min" : 45566,
 *                          "max" : 87765,
 *                          },
 *                          ] 
 *                  },
 *                  ...
 * 
 *              ] 
 * 
 * ]
 *
 * @param {*} collectionLivres Données du fichier json
 * @param {*} pretsPublic Données du fichier json
 * @returns {array}
 */

function createConnectedDotPlotSources(collectionLivres, pretsPublic) {

    var publicSources = [];

    for (const year in collectionLivres) {
        var perYear = new Object();
        perYear.year = year;
        var libraries = [];

        collectionLivres[year].forEach(function (d, i) {
            
            var library = new Object();
            library.name = d["BIBLIOTHÈQUE"];

            var public = [];
            var kids = findMinMaxKids(year, d, pretsPublic);

            var adult = findMinMaxAdult(year, d, pretsPublic);

            public.push(kids);
            public.push(adult);

            library.public = public;

            libraries.push(library);

        });

        perYear.libraries = libraries;
        publicSources.push(perYear)
    };

    return publicSources;
}


function findMinMaxKids(year, library, pretsPublic) {
    var kids = new Object();
    kids.name = "Jeune";
    kids.min = 0;
    kids.max = 0;

    pretsPublic[year].forEach(function (d, i) {
        if(d["BIBLIOTHÈQUE"] == library["BIBLIOTHÈQUE"]) {

            var collectNumb = parseInt(library["JEUNE"]);
            var empruntNumb = parseInt(d["Jeunes"].replace(",", ""));

            kids.min = empruntNumb <= collectNumb ? empruntNumb : collectNumb;
            kids.max = empruntNumb > collectNumb ? empruntNumb : collectNumb;

        }
    })

    return kids;
}

function findMinMaxAdult(year, library, pretsPublic) {
    var adult = new Object();
    adult.name = "Adulte";
    adult.min = 0;
    adult.max = 0;

    pretsPublic[year].forEach(function (d, i) {
        if(d["BIBLIOTHÈQUE"] == library["BIBLIOTHÈQUE"]) {

            var collectNumb = parseInt(library["ADULTE"]);
            var empruntNumb = parseInt(d["Adultes"].replace(",", ""));
            
            adult.min = empruntNumb <= collectNumb ? empruntNumb : collectNumb;
            adult.max = empruntNumb > collectNumb ? empruntNumb : collectNumb;

        }
    })

    return adult;
}