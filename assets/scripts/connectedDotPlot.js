/***** ConnectedDotPlot Class  *****/
ConnectedDotPlot = class ConnectedDotPlot {

    static selectedYear = "";
    static selectedLibName = "";
    static legendData = [{"name" : "Inventaire", "color" : "lollipop-Inventaire", "widthPad" : 100, "heightPad" : 180, "textWidthPad" : 190, "textHeightPad" : 175},
                         {"name" : "Emprunts", "color" : "lollipop-Emprunts", "widthPad" : -25, "heightPad" : 180, "textWidthPad" : 65, "textHeightPad" : 175}]

    /***** Class Constructor  *****/
    constructor(data) {
        this.data = data
    };

    /***** Create Year Selection DropDown  *****/
    onYearDropDownUpdate(data, x, y, group, libDropDown, lollipopsGroup) {
        this.yearDropdown = d3.select("#selectYear")
            .on("change", function() {
                ConnectedDotPlot.selectedYear = this.value;
                ConnectedDotPlot.selectedLibName = libDropDown.property("value");
                ConnectedDotPlot.updateDataLibrary(data, ConnectedDotPlot.selectedYear, ConnectedDotPlot.selectedLibName, x, y, group, lollipopsGroup, false);
            })         
    };

    /***** Create Library Selection DropDown  *****/
    onLibraryDropDownUpdate(data, year, x, y, group, lollipopsGroup) {
        var librariesNames = [];
        data.forEach(function(c) {
            if(c.year == year) {
                c.libraries.forEach(function(d) {
                    librariesNames.push({"name" : d.name});
                })
            }
        });
        
        var svg = d3.select("#ConnectedDotPlot")
        var libDropdown = d3.select("#selectLibrary")
            .on("change", function() {
                ConnectedDotPlot.selectedYear = d3.select("#selectYear").property("value");
                ConnectedDotPlot.selectedLibName = this.value;
                ConnectedDotPlot.updateDataLibrary(data, ConnectedDotPlot.selectedYear, ConnectedDotPlot.selectedLibName, x, y, group, lollipopsGroup, false);
            });

        libDropdown.selectAll("option")
            .data(librariesNames)
            .enter().append("option")
            .attr("value", function (d) { return d.name; })
            .text(function (d) { return d.name; });
        
        return libDropdown;
    };

    /***** Create a Connected Dot Plot for one library *****/
    static createLibConnectedDotPlot(data, year, libName, x, y, group, height, lollipopsGroup, multiple) {
        /***** Get selected library data domains *****/
        ConnectedDotPlot.selectedYear = year;
        ConnectedDotPlot.selectedLibName = libName;
        var libData = ConnectedDotPlot.selectedLibraryData(data, year, libName);
        
        /***** Axis domains *****/
        ConnectedDotPlot.domainX(x, libData);
        if(multiple) {
            ConnectedDotPlot.domainYMultiple(y, data[data.length - 1].libraries);
        } else {
            ConnectedDotPlot.domainY(y, libData);
        }
        
        /***** Append Axis *****/
        var xAxis = d3.axisBottom(x);
        var yAxis = d3.axisLeft(y).ticks(5);
        if(multiple) {
            yAxis.ticks(3);
        }
        group.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(45)")
            .attr("text-anchor", "start")
            .attr("dx", "0.5em");
        
        group.append("g")
            .attr("class", "y axis")
            .call(yAxis);
        
        /***** Append Legend to axis *****/
        group.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .attr("font-size", "x-small")
            .style("text-anchor", "end")
            .text("Nombre de titres ");
        
        var libNameLabel = group.append('text')
            .attr("y", 20)
            .attr("x", 80)
            .attr("dx", "-2em")
            .attr("dy", "-.60em")
            .attr("style", "bold")
            .attr("font-size", "x-small")
            .text(libName);

        if(multiple) {
            libNameLabel.attr("id", "libNameLabelMultiple")
        } else {
            libNameLabel.attr("id", "libNameLabel")
        }
        
        /***** Update lollipops *****/
        ConnectedDotPlot.updateLollipops(lollipopsGroup, libData, x, y);
    }

    /***** Append Legend for color coding *****/
    static legend(svg, width, height) {
        const legend = svg.selectAll("svg")
            .data(ConnectedDotPlot.legendData)
            .enter()
            .append("svg");

        legend.append("circle")
            .attr("class", function(d) { return d.color; })
            .attr("r", 5)
            .attr("cx", function(d) { return width - d.widthPad; })
            .attr("cy", function(d) { return height - d.heightPad; })

        legend.append("text")
            .attr("x", function(d) { return width - d.textWidthPad; })
            .attr("y", function(d) { return height - d.textHeightPad ;})
            .text( function(d) { return d.name; })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
    }

    /***** Axis domains  functions *****/
    static domainX(x, libData) {
        return x.domain(libData.map(function(d) { return d.name }));
    }
    
    static domainY(y, libData) {
        return y.domain([0, d3.max(libData, function(d) { return d.max; })]);
    }
    
    static domainYMultiple(y, data) {
        return y.domain([0, d3.max(data, function(d) { 
            var libData = d.public ? d.public : d.format;
            return d3.max(libData, function(d) { return d.max; }); })]);
    }
    
    /***** Find current selected library data *****/
    static selectedLibraryData(data, selectedYear, selectedLibName) {
        var libData = [];
        data.forEach(function(d) {
            if(d.year == selectedYear) {
                var lib = d.libraries;
                lib.forEach(function(e) {
                    if(e.name == selectedLibName) {
                        libData = e.public ? e.public : e.format;
                    }
                });
            }
        });

        return libData;
    }

    /***** Library selection function - updates the connected dot plot *****/
    static updateDataLibrary(data, selectedYear, selectedLibName,  x, y, group, lollipopsGroup, multiple) {
        var libData = ConnectedDotPlot.selectedLibraryData(data, selectedYear, selectedLibName);
        if(libData.length > 0) {
            
            /***** Update Axis domains *****/
            ConnectedDotPlot.domainX(x, libData);
            if(multiple) {
                ConnectedDotPlot.domainYMultiple(y, data[data.length - 1].libraries);
            } else {
                ConnectedDotPlot.domainY(y, libData);
            }
            
            /***** Update Lollipops *****/
            ConnectedDotPlot.updateLollipops(lollipopsGroup, libData, x, y)
            
            /***** Update Axis *****/
            var xAxis = d3.axisBottom(x);
            var yAxis = d3.axisLeft(y).ticks(5);
            if(multiple) {
                yAxis.ticks(3);
            }
            group.select(".x.axis")
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(45)")
            .attr("text-anchor", "start")
            .attr("dx", "0.5em");
            
            group.select(".y.axis")
            .call(yAxis);
            
            if(!multiple) {
                group.select("#libNameLabel").text(selectedLibName);
            }
        } else {
            // If the previous selected library doesn't exist for the selected year 
            group.select("#libNameLabel").text("");
            lollipopsGroup.selectAll("*").remove();
        }
    }

    /***** Generate new lollipops *****/
    static updateLollipops(lollipopsGroup, libData, x, y) {
        var lineGenerator = d3.line();
        var lollipopLinePath = function(d) {
            return lineGenerator([[x(d.name) + (x.bandwidth() / 2) , y(d.min)], [x(d.name) + (x.bandwidth() / 2), y(d.max)]]); 
        };
        
        lollipopsGroup.selectAll("*").remove();
        var lollipopTip = ConnectedDotPlot.createLollipopTip();
        var lollipops = lollipopsGroup.selectAll("g")
        .data(libData)
        .enter().append("g")
        .attr("class", "lollipop")
        .on('mouseover', lollipopTip.show)
        .on('mouseout', lollipopTip.hide);
        
        lollipops.append("path")
        .attr("class", "lollipop-line")
        .attr("d", lollipopLinePath);
        
        /***** Minimum lollipop *****/
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
            return x(d.name) + (x.bandwidth() / 2); })
            .attr("cy", function(d) { return y(d.min); })
            
        /***** Maximum lollipop *****/
        lollipops.append("circle")
        .attr("class", function(d) {
            if(d.maxCategory == "Inventaire") {
                return "lollipop-Inventaire";
            } else {
                return "lollipop-Emprunts";
            }
        })
        .attr("r", 5)
        .attr("cx", function(d) { return x(d.name) + (x.bandwidth() / 2); })
        .attr("cy", function(d) { return y(d.max); });

        lollipops.call(lollipopTip);
    }

    /***** Handle tip on lollipop *****/
    static createLollipopTip() {
        var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0]);
        tip.html(function(d) {
            return d.minCategory + " : " + d.min + "<br>" + d.maxCategory + " : " + d.max;
        });
        
        return tip;
    }

}


/**
 * Transforme les données d'emprunts à partir des données json.
 * Format de retour :
 * [
 *     {
 *        "year " : 2018,
 *        "librairies" : [ 
 *            {"name" : "(AHC) ",
 *             public/format : [ { 
 *              "name" : "Jeune",
 *               "min" : 25566,
 *               "max" : 98765,
 *               "minCategory" : "Inventaire",
 *               "maxCategory" : "Emprunts"
 *             },
 *             ...
 *         ]
 *      }
 *      ... 
 * ]
 *
 * @param {*} collectionLivres Données du fichier json
 * @param {*} pretsPublic Données du fichier json
 * @returns {array}
 */

function createConnectedDotPlotSourcesPublic(collectionLivres, pretsPublic) {
    var publicSources = [];
    for (const year in collectionLivres) {
        var perYear = new Object();
        perYear.year = year;
        var libraries = [];
        collectionLivres[year].forEach(function (d, i) {
            var library = new Object();
            library.name = d["BIBLIOTHÈQUE"];
            var public = [];
            var kids = findMinMax(year, d, pretsPublic, "JEUNE", "Jeunes");
            var adult = findMinMax(year, d, pretsPublic, "ADULTE", "Adultes");
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

function createConnectedDotPlotSourcesFormat(collectionFormat, pretsFormat) {
    var formatSources = [];

    for (const year in collectionFormat) {
        var perYear = new Object();
        perYear.year = year;
        var libraries = [];
        collectionFormat[year].forEach(function (d) {
            var library = new Object();
            library.name = d["BIBLIOTHÈQUE"];
            var format = [];
            for(const property in d) {
                if(property != "BIBLIOTHÈQUE") {
                    var propertyField = findMinMaxFormat(year, d, pretsFormat, property);
                    format.push(propertyField); 
                }
            }
            library.format = format;
            libraries.push(library);
        });
        perYear.libraries = libraries;
        formatSources.push(perYear)
    };
    
    return formatSources;
}

/***** Find min and max category per public *****/
function findMinMax(year, library, pretsPublic, keyWordLibrary, keyWordLoans) {
    var public = new Object();
    public.name = keyWordLoans;
    public.min = 0;
    public.max = 0;
    public.minCategory = "";
    public.maxCategory = "";

    pretsPublic[year].forEach(function (d) {
        if(d["BIBLIOTHÈQUE"] == library["BIBLIOTHÈQUE"]) {
            var collectNumb = parseInt(library[keyWordLibrary]);
            var empruntNumb = parseInt(d[keyWordLoans].replace(",", ""));
            public.min = empruntNumb <= collectNumb ? empruntNumb : collectNumb;
            public.minCategory = empruntNumb <= collectNumb ? "Emprunts" : "Inventaire";
            public.max = empruntNumb > collectNumb ? empruntNumb : collectNumb;
            public.maxCategory = empruntNumb > collectNumb ? "Emprunts" : "Inventaire";
        }
    })

    return public;
}

/***** Find min and max category per format *****/
function findMinMaxFormat(year, library, pretsformat, keyWord) {
    var format = new Object();
    format.name = keyWord;
    format.min = 0;
    format.max = 0;
    format.minCategory = "";
    format.maxCategory = "";

    pretsformat[year].forEach(function (d, i) {
        if(d["BIBLIOTHÈQUE"] == library["BIBLIOTHÈQUE"]) {
            var collectNumb = parseInt(library[keyWord].replace(/ /g,"").replace(",", ""));
            var empruntNumb = parseInt(d[keyWord]);
            format.min = empruntNumb <= collectNumb ? empruntNumb : collectNumb;
            format.minCategory = empruntNumb <= collectNumb ? "Emprunts" : "Inventaire";
            format.max = empruntNumb > collectNumb ? empruntNumb : collectNumb;
            format.maxCategory = empruntNumb > collectNumb ? "Emprunts" : "Inventaire";
        }
    })

    return format;
}
