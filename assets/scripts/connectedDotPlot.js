
/***** ConnectedDotPlot Class  *****/

// ConnectedDotPlot.selectedYear;

ConnectedDotPlot = class ConnectedDotPlot {

    static selectedYear = "";
    static selectedLibName = "";

    constructor(data) {
        this.data = data
    };

    // Create a Connected Dot Plot for one library
    static createLibConnectedDotPlot(data, year, libName, x, y, group, height) {

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

        var xAxis = d3.axisBottom(x);
        var yAxis = d3.axisLeft(y);

        if(libData.length > 0) {

            
            /***** Axis domains *****/
            ConnectedDotPlot.domainX(x, libData);
            ConnectedDotPlot.domainY(y, libData);
            
            /***** Append Axis *****/
            group.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
            
            group.append("g")
            .attr("class", "y axis")
            .call(yAxis);
            
            /***** Generate lollipops *****/
            var lineGenerator = d3.line();

            var lollipopLinePath = function(d) {
                return lineGenerator([[x(d.name) + (x.bandwidth() / 2) , y(d.min)], [x(d.name) + (x.bandwidth() / 2), y(d.max)]]); 
            };
            
            var lollipopsGroup = group.append("g").attr("class", "lollipops");
            
            var lollipops = lollipopsGroup.selectAll("g")
            .data(libData)
            .enter().append("g")
            .attr("class", "lollipop")
            
            lollipops.append("path")
            .attr("class", "lollipop-line")
            .attr("d", lollipopLinePath);
            
            // Minimum lollipop
            lollipops.append("circle")
            .attr("class", function(d) {
                if(d.minCategory == "Inventaire") {
                    return "lollipop-Inventaire";
                } else {
                    return "lollipop-Emprunts";
                }
            })
            .attr("r", 5)
            .attr("cx", function(d) {
                return x(d.name) + (x.bandwidth() / 2);
            })
            .attr("cy", function(d) {
                return y(d.min);
            });
            
            lollipops.append("circle")
            .attr("class", function(d) {
                if(d.maxCategory == "Inventaire") {
                    return "lollipop-Inventaire";
                } else {
                    return "lollipop-Emprunts";
                }
            })
            .attr("r", 5)
            .attr("cx", function(d) {
                return x(d.name) + (x.bandwidth() / 2);
            })
            .attr("cy", function(d) {
                return y(d.max);
            });
            
        } else {
            group.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
            
            group.append("g")
            .attr("class", "y axis")
            .call(yAxis);
        }

    }

    /***** Axis domains  functions *****/
    static domainX(x, libData) {
        return x.domain(libData.map(function(d) { return d.name }));
    }

    static domainY(y, libData) {
        return y.domain([0, Math.max(libData[0].max, libData[1].max)]);
    }

    createYearDropDown(data, x, y, group, height) {
        var svg = d3.select("#ConnectedDotPlot")
        // var value = "";
        var dropdown = svg.insert("select", "svg")
                    .on("change", function() {
                        ConnectedDotPlot.selectedYear = this.value;
                        // ConnectedDotPlot.updateDataYear(data, this.value);
                        ConnectedDotPlot.updateDataLibrary(data, ConnectedDotPlot.selectedYear, ConnectedDotPlot.selectedLibName, x, y, group, height);
                    });

        
        dropdown.selectAll("option")
            .data(data)
            .enter().append("option")
            .attr("value", function (d) { 
                return d.year; })
            .text(function (d) {
                return d.year; 
            });

        this.createLibraryDropDown(data, data[0].year, x, y, group, height);

        return dropdown;
    };

    createLibraryDropDown(data, year, x, y, group, height) {
        var librariesNames = [];

        data.forEach(function(c) {
            if(c.year == year) {
                c.libraries.forEach(function(d) {
                    librariesNames.push({"name" : d.name});
                })
            }
        })

        
        var svg = d3.select("#ConnectedDotPlot")
        var dropdown = svg.insert("select", "svg")
                    .on("change", function() {
                        ConnectedDotPlot.selectedLibName = this.value;
                        ConnectedDotPlot.updateDataLibrary(data, ConnectedDotPlot.selectedYear, ConnectedDotPlot.selectedLibName, x, y, group, height);
                    });

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
        ConnectedDotPlot.createLibConnectedDotPlot(data, initialData.year, initialData.libraries[0].name,  x, y, group, height);

    };
    
    
    /***** Year selection function *****/
    // This update the library dropdown list
    
    // static updateDataYear(data, year){
    //     var librariesNames = [];

    //     data.forEach(function(c) {
    //         if(c.year == year) {
    //             c.libraries.forEach(function(d) {
    //                 librariesNames.push({"name" : d.name});
    //             });
    //         };
    //     });
        
    // };

    /***** Library selection function *****/
    static updateDataLibrary(data, selectedYear, selectedLibName,  x, y, group, height) {
        group.selectAll("*").remove();
        ConnectedDotPlot.createLibConnectedDotPlot(data, selectedYear, selectedLibName,  x, y, group, height);
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
 *                          "minCategory" : "Inventaire",
 *                          "maxCategory" : "Emprunts"
 *                          },
 *                          {
 *                          "name" : "Adulte",
 *                          "min" : 45566,
 *                          "max" : 87765,
 *                          "minCategory" : "Inventaire",
 *                          "maxCategory" : "Emprunts"
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
    kids.minCategory = "";
    kids.maxCategory = "";

    pretsPublic[year].forEach(function (d, i) {
        if(d["BIBLIOTHÈQUE"] == library["BIBLIOTHÈQUE"]) {

            var collectNumb = parseInt(library["JEUNE"]);
            var empruntNumb = parseInt(d["Jeunes"].replace(",", ""));

            kids.min = empruntNumb <= collectNumb ? empruntNumb : collectNumb;
            kids.minCategory = empruntNumb <= collectNumb ? "Emprunts" : "Inventaire";
            kids.max = empruntNumb > collectNumb ? empruntNumb : collectNumb;
            kids.maxCategory = empruntNumb > collectNumb ? "Emprunts" : "Inventaire";

        }
    })

    return kids;
}

function findMinMaxAdult(year, library, pretsPublic) {
    var adult = new Object();
    adult.name = "Adulte";
    adult.min = 0;
    adult.max = 0;
    
    adult.minCategory = "";
    adult.maxCategory = "";

    pretsPublic[year].forEach(function (d, i) {
        if(d["BIBLIOTHÈQUE"] == library["BIBLIOTHÈQUE"]) {

            var collectNumb = parseInt(library["ADULTE"]);
            var empruntNumb = parseInt(d["Adultes"].replace(",", ""));
            
            adult.min = empruntNumb <= collectNumb ? empruntNumb : collectNumb;
            adult.minCategory = empruntNumb <= collectNumb ? "Emprunts" : "Inventaire";

            adult.max = empruntNumb > collectNumb ? empruntNumb : collectNumb;
            adult.maxCategory = empruntNumb > collectNumb ? "Emprunts" : "Inventaire";


        }
    })

    return adult;
}