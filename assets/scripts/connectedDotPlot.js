/***** ConnectedDotPlot Class  *****/

ConnectedDotPlot = class ConnectedDotPlot {

    static selectedYear = "";
    static selectedLibName = "";

    constructor(data) {
        this.data = data
    };

    // Create a Connected Dot Plot for one library
    static createLibConnectedDotPlot(data, year, libName, x, y, group, height, lollipopsGroup, multiple) {

        ConnectedDotPlot.selectedYear = year;

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

        /***** Axis domains *****/
        if(multiple) {
            console.log("IN IF", data[5].libraries);
            ConnectedDotPlot.domainX(x, libData);
            ConnectedDotPlot.domainYMultiple(y, data[data.length - 1].libraries);
        } else {
            ConnectedDotPlot.domainX(x, libData);
            ConnectedDotPlot.domainY(y, libData);
        }
            
        
        /***** Append Axis *****/
        group.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
        
        group.append("g")
        .attr("class", "y axis")
        .call(yAxis);

        ConnectedDotPlot.updateLollipops(lollipopsGroup, libData, x, y);
            
    }


    /***** Axis domains  functions *****/
    static domainX(x, libData) {
        return x.domain(libData.map(function(d) { return d.name }));
    }
    
    static domainY(y, libData) {
        return y.domain([0, Math.max(libData[0].max, libData[1].max)]);
    }
    
    static domainYMultiple(y, data) {
        console.log("IN DOMAIN", data);
        return y.domain([0, d3.max(data, function(d) { return Math.max(d.public[0].max, d.public[1].max)})]);
    }

    createYearDropDown(data, x, y, group, height, libDropDown, lollipopsGroup) {
        var svg = d3.select("#ConnectedDotPlot")
        // var value = "";
        this.yearDropdown = svg.insert("select", "svg")
        .on("change", function() {
            ConnectedDotPlot.selectedYear = this.value;
            var newLibNames = ConnectedDotPlot.updateDataYear(data, this.value);
            ConnectedDotPlot.updateLibraryDropdown(newLibNames, libDropDown);
            ConnectedDotPlot.updateDataLibrary(data, ConnectedDotPlot.selectedYear, ConnectedDotPlot.selectedLibName, x, y, group, height, lollipopsGroup);
        });

        this.yearDropdown.selectAll("option")
            .data(data)
            .enter().append("option")
            .attr("value", function (d) { 
                return d.year; })
            .text(function (d) {
                return d.year; 
            })
            ;

    };

    createLibraryDropDown(data, year, x, y, group, height, lollipopsGroup) {
        var librariesNames = [];

        data.forEach(function(c) {
            if(c.year == year) {
                c.libraries.forEach(function(d) {
                    librariesNames.push({"name" : d.name});
                })
            }
        })

        
        var svg = d3.select("#ConnectedDotPlot")
        var libDropdown = svg.insert("select", "svg")
                    .on("change", function() {
                        ConnectedDotPlot.selectedLibName = this.value;
                        ConnectedDotPlot.updateDataLibrary(data, ConnectedDotPlot.selectedYear, ConnectedDotPlot.selectedLibName, x, y, group, height, lollipopsGroup);
                    });

        libDropdown.selectAll("option")
            .data(librariesNames)
            .enter().append("option")
            .attr("value", function (d) { 
                return d.name;
            })
            .text(function (d) {
                return d.name; 
            });
        
        return libDropdown;
    };
    
    static updateLibraryDropdown(newLibrariesNames, libDropDown) {
        libDropDown.selectAll("option").remove();
        libDropDown.selectAll("option")
        .data(newLibrariesNames)
        .enter().append("option")
        .attr("value", function (d) { 
            return d.name;
        })
        .text(function (d) {
            return d.name; 
        });
    }
    
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
        
        return librariesNames;
    };

    /***** Library selection function *****/
    static updateDataLibrary(data, selectedYear, selectedLibName,  x, y, group, height, lollipopsGroup) {

        var libData = [];
        data.forEach(function(d) {
            if(d.year == selectedYear) {
                var lib = d.libraries;
                lib.forEach(function(e) {
                    if(e.name == selectedLibName) {
                        libData = e.public;
                    }
                });
            }
        });

        // /***** Update Axis domains *****/
        ConnectedDotPlot.domainX(x, libData);
        ConnectedDotPlot.domainY(y, libData);
        
        /***** Update Lollipops *****/
        ConnectedDotPlot.updateLollipops(lollipopsGroup, libData, x, y)

        var xAxis = d3.axisBottom(x);
        var yAxis = d3.axisLeft(y);

        group.select(".x.axis")
        .call(xAxis);
            
        group.select(".y.axis")
        .call(yAxis);
    }

    
    static updateLollipops(lollipopsGroup, libData, x, y) {
        /***** Generate lollipops *****/
        var lineGenerator = d3.line();

        var lollipopLinePath = function(d) {
            return lineGenerator([[x(d.name) + (x.bandwidth() / 2) , y(d.min)], [x(d.name) + (x.bandwidth() / 2), y(d.max)]]); 
        };

        lollipopsGroup.selectAll("*").remove();

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
        // Maximum lollipop
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