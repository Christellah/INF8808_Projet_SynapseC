
// Constants
const mapPos = {
    latitude : 45.539699, 
    longitude : -73.698378,
    initZoom : 11,
    minZoom : 9,
    maxZoom : 16
};

const pieLgInfo = {
    domain : ["francais", "anglais", "autres"],
    colorRange : ["#196aff", "#fe6135", "#f426a5"],
    legendTexts : {"francais":"Français", "anglais":"Anglais", "autres":"Autres"}
}
const piePubInfo = {
    domain : ["adultes", "jeunes", "autres"],
    colorRange : ["#3d85b3", "#00d2b8", "#fcff61"],
    legendTexts : {"adultes":"Adultes", "jeunes":"Jeunes", "autres":"Autres"}
}
const pieFormInfo = {
    domain : ["titresPhysiques", "titresElectroniques", "autres"],
    colorRange : ["#591aef", "#f15cb6", "#fdbaba"],
    legendTexts : {"titresPhysiques":"Titres phys.", "titresElectroniques":"Titres élect.", "autres":"Autres"}
}
const pieChartDim = {
    width : 60,
    height : 60,
    margin : 4,
    left : 30,
    left1 : 95,
    left2 : 160,
    top : 60/2
}


/**
 * Libraries Map Class
 * */ 

LibrariesMap = class LibrariesMap {
    /**
     * Constructs Libraries Map
     *  - code adapted from : @see https://www.d3-graph-gallery.com/graph/backgroundmap_leaflet.html
     *  - code adapted from : @see https://www.d3-graph-gallery.com/graph/bubblemap_leaflet_basic.html
    * */ 
    constructor(divId, libInfoSources) {

        this.divId = '#' + divId;
        this.libInfoSources = libInfoSources;

        // Initialize map
        var libMap = L.map(divId)
                        .setView([mapPos.latitude, mapPos.longitude], mapPos.initZoom)

        // Create map's background (from OpenStreetmap)
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
            minZoom: mapPos.minZoom,
            maxZoom: mapPos.maxZoom,
        }).addTo(libMap);

        this.createSymbols(libMap);
        // Update circles positions on map deplacements or zoom
        libMap.on("moveend", function () { LibrariesMap.updateCircles(libMap) });
    }


    /**
     * Creates the svg layer on the map to display the symbols
     * @param libMap : The map
     */
    createSymbols(libMap) {
        // Initialize the svg layer in libMap
        libMap._initPathRoot();
  
        // Get the svg to create the symbols at the libs locations
        var svg = d3.select(this.divId).select("svg");
        
        // Apend the libraries infos data
        var circleGroup = svg.selectAll("circle")
        .data(this.libInfoSources)
        .enter();
        
        // Create info panel
        var panel = this.createInfoPanel(circleGroup);
        
        // Make a range for circles radius, proportional to frequentations/population_arrondissement
        var circleRadiusScale = d3.scaleLinear()
            .domain([d3.min(this.libInfoSources, function(d) { return normalizedFrequentations(d); }), 
                     d3.max(this.libInfoSources, function(d) { return normalizedFrequentations(d); })])
            .range([5,18]);
        
        // Draw the circles
        circleGroup.append("circle")
            .attr("r", function(d) { return circleRadiusScale(normalizedFrequentations(d)); })
            .attr("class", "lib-circle")
            .on("mouseover", function(d) {
                // Compute cirlcle positioning for tooltip
                var circleMatrix = this.getScreenCTM().translate(+ this.getAttribute("cx"), + this.getAttribute("cy"));
                var cirlceRadius = +this.getAttribute("r");
                // Display tooltip
                return LibrariesMap.nameTooltip.style("visibility", "visible")
                    .html(d.nom)
                    .style("padding", "0 5px")
                    .style("left", function () {
                        // Tip div width to center tooltip
                        var tipWidthOffset = this.getBoundingClientRect().width / 2;
                        return (circleMatrix.e + window.pageXOffset - tipWidthOffset) + "px";
                    } )
                    .style("top", (circleMatrix.f + window.pageYOffset - cirlceRadius-30) + "px")
            })
            .on("mouseout", function(){ return LibrariesMap.nameTooltip.style("visibility", "hidden"); })
            .on("click", function(d) {
                // Hide tooltip and show selected circle
                LibrariesMap.nameTooltip.style("visibility", "hidden");
                circleGroup.selectAll("circle").classed("circle-selected", false);
                d3.select(this).classed("circle-selected", true);

                // Center the map on the selected library
                libMap.setView([d.localisation.latitude, d.localisation.longitude], mapPos.initZoom)

                // Display info panel
                LibrariesMap.displayInfoPanel(panel, d);
            });

        // Place the circles
        LibrariesMap.updateCircles(libMap);
    }


    createInfoPanel(circleGroup) {
        var panel = d3.select("#panel");

        // Close panel button
        panel.append("button")
            .text("X")
            .on("click", function () {
            panel.style("display", "none");
            circleGroup.selectAll("circle").classed("circle-selected", false);
            });

        // Create the pie charts svg
        this.pieSvg = panel.append("svg")
            .attr("id", "pie-svg")
            .attr("width", "100%")
            .attr("height", "50%")

        // Language Pie chart
        this.pieSvg.append("g")
            .attr("id", "pieLg-group")
            .attr("transform", "translate(" + pieChartDim.left + "," + pieChartDim.top + ")");
        // Public Pie chart
        this.pieSvg.append("g")
            .attr("id", "piePub-group")
            .attr("transform", "translate(" + pieChartDim.left1 + "," + pieChartDim.top + ")");
        // Format Pie chart
        this.pieSvg.append("g")
            .attr("id", "pieForm-group")
            .attr("transform", "translate(" + pieChartDim.left2 + "," + pieChartDim.top + ")");
        
        // Legend
        this.createLegend(8, LibrariesMap.pieLgColorScale, pieLgInfo.legendTexts);
        this.createLegend(pieChartDim.left1*0.75, LibrariesMap.piePubColorScale, piePubInfo.legendTexts);
        this.createLegend(pieChartDim.left2*0.8, LibrariesMap.pieFormColorScale, pieFormInfo.legendTexts);

        return panel;
    }

    createLegend(leftOffset, colorsScale, pieLegendTexts) {
        var legend = this.pieSvg.append("g")
            .attr("transform", "translate(" + leftOffset + ", 65)")
            .selectAll(".colors")
            .data(colorsScale.domain())
            .enter();

        legend.append("rect")
                .attr("x", 0)
                .attr("y", (d, i) => 15*i)
                .attr("width", 8)
                .attr("height", 8)
                .attr("stroke","black")
                .attr("fill", (d) => colorsScale(d))
                .style("opacity", 0.85);

        legend.append("text")
            .attr("x", 11)
            .attr("y", (d, i) => 15*i + 8)
            .style("font-size", "10px")
            .text(function(d) {return pieLegendTexts[d] });
    }

    // Pie charts color scale
    static pieLgColorScale = d3.scaleOrdinal().domain(pieLgInfo.domain).range(pieLgInfo.colorRange);
    static piePubColorScale = d3.scaleOrdinal().domain(piePubInfo.domain).range(piePubInfo.colorRange);
    static pieFormColorScale = d3.scaleOrdinal().domain(pieFormInfo.domain).range(pieFormInfo.colorRange);

    // Tool tip to display the library's name
    static nameTooltip = d3.select("body").append("div").attr("class", "libNameTooltip");

    // Display the info panel
    static displayInfoPanel(panel, data) {
        // Updatte and display panel
        LibrariesMap.updatePanel(panel, data);
        panel.style("display", "block");
        // Update pie charts
        LibrariesMap.updatePieCharts(panel, data);
    }

    // Update pie charts
    static updatePieCharts(panel, libData) {
        // Languages Pie chart
        var pieLgGroup = panel.select("#pie-svg").select("#pieLg-group");
        LibrariesMap.updateSinglePieChart(libData.langues, pieLgGroup, LibrariesMap.pieLgColorScale);
        // Public Pie chart
        var piePubGroup = panel.select("#pie-svg").select("#piePub-group");
        LibrariesMap.updateSinglePieChart(libData.public, piePubGroup, LibrariesMap.piePubColorScale);
        // Formats Pie chart
        var pieFormGroup = panel.select("#pie-svg").select("#pieForm-group");
        LibrariesMap.updateSinglePieChart(libData.formats, pieFormGroup, LibrariesMap.pieFormColorScale);
        console.log(libData.public)
    }

    // Update a single pie chart
    static updateSinglePieChart(libData, pieGroup, colorsScale) {
        pieGroup.selectAll("*").remove();
        
        // Compute position of the parts of the pie
        var computePieParts = d3.pie().value(function(d) {return d.value;})
        // Pie chart radius
        var radius = Math.min(pieChartDim.width, pieChartDim.height) / 2 - pieChartDim.margin;
        
        // Build the pie chart
        pieGroup
            .selectAll('path')
            .data(computePieParts(d3.entries(libData)))
            .enter()
            .append('path')
            .attr('d', d3.arc()
                .innerRadius(0)
                .outerRadius(radius)
            )
            .attr('fill', function(d) { return(colorsScale(d.data.key)); })
            .attr("stroke", "black")
            .style("stroke-width", "2px")
            .style("opacity", 0.85);
    }

    // Update the info panel
    static updatePanel(panel, biblio) {
        // Get the value normalized by the population in the borough
        var normalized = function (biblio, value, ratio=1) { 
            if (!value) return "-";
            return (value / biblio.populationArrondissement * ratio).toFixed(2); }
            
        panel.select("#lib-name").text("Bibliothèque " + biblio.nom);
        panel.select("#nb-h").text("Nombre d'heures d'ouverture par semaine : " + biblio.heuresOuverture + " h/sem");
        panel.select("#surf").text("Surface moyenne pour 1000 habitants : " + normalized(biblio, biblio.superficie, 1000) + " m2");
        panel.select("#nb-titres").text("Nombre de titres par habitant : " + normalized(biblio, biblio.inventaire));
        panel.select("#nb-freq").text("Nombre de visites par habitant : " + normalized(biblio, biblio.frequentations));

        panel.select("#services").text("Types de titres offerts :");
    }

    // Update circles on map 
    static updateCircles(libMap) {
        d3.selectAll("circle")
        .attr("cx", function(d){ return libMap.latLngToLayerPoint([d.localisation.latitude, d.localisation.longitude]).x })
        .attr("cy", function(d){ return libMap.latLngToLayerPoint([d.localisation.latitude, d.localisation.longitude]).y })
    } 
}

/**
 * Transforme les données des informations des bibliothèques à partir des données json.
 * Format de retour :
 * [
 *     {
 *          "nom": "Ahuntsic",
 *          "code": "a78",
 *          "arrondissement": "Ahuntsic-Cartierville",
 *          "codeArrondissement": "(AHC)",
 *          "inventaire": "133,819",
 *          "frequentations": "306,670",
 *          "superficie": 2033.50,
 *          "heuresOuverture": "53.00",
 *          "public": {"adultes": 76620, "jeunes": 61301, "autres": 0},
 *          "langues": {"francais": 125060, "anglais": 11990, "autres": 871},
 *          "formats": {"titresPhysiques": 118449, "titresElectroniques": 9863, "autres": 1328},
 *          "localisation": {"latitude": 45.553423, "longitude": -73.662799},
 *          "populationArrondissement": 134245
 *      }, ...
 * ]
 *
 * @param {*} data Données du fichier json
 * @returns {array}
 */
function createLibInfoSources(data) {
    var sources = [];

    // Constructs each library object
    data["2018"].forEach(function (d) {
        var biblio = new Object();
        biblio.nom = d["Bibliothèque"];
        biblio.code = d["Code bibliothèque"];

        biblio.arrondissement = d["Arrondissement"];
        biblio.codeArrondissement = d["Code arrondissement"];

        biblio.inventaire = convertToInt(d["Inventaire"]);
        biblio.frequentations = convertToInt(d["Fréquentations"]);
        biblio.superficie = convertToInt(d["Superficie en m2"]);
        biblio.heuresOuverture = d["Heures d'ouverture par semaine"];

        biblio.public = extractPublicTypes(d);
        biblio.langues = extractLanguages(d);
        biblio.formats = extractFormats(d);
        biblio.localisation = extractLocalisation(d);

        biblio.populationArrondissement = convertToInt(d["Population arrondissement"]);

        sources.push(biblio);
    });

    return sources;
}


/**
 * Converts string to integer
 * @param {string} value
 * @returns {int}
 */
function convertToInt(value) {
    return value ? parseInt(value.replace(",", "").replace(/ /g, "")) : undefined;
}
/**
 * Converts string to float
 * @param {string} value
 * @returns {float}
 */
function convertToFloat(value) {
    return parseFloat(value.replace(",", "").replace(/ /g, ""));
}
/**
 * Extracts the public types : {"adultes": 76620, "jeunes": 61301, "autres": 0}
 * @param {*} data
 * @returns {*} publicTypes
 */
function extractPublicTypes(data) {
    var publicTypes = new Object();
    publicTypes.adultes = convertToInt(data["Secteur Adultes"]);
    publicTypes.jeunes = convertToInt(data["Secteur Jeunes"]);
    publicTypes.autres = convertToInt(data["Secteur Autres"]);

    return publicTypes;
}
/**
 * Extracts the languages : {"francais": 125060, "anglais": 11990, "autres": 871}
 * @param {*} data
 * @returns {*} languages
 */
function extractLanguages(data) {
    var languages = new Object();
    languages.francais = convertToInt(data["Français"]);
    languages.anglais = convertToInt(data["Anglais"]);
    languages.autres = convertToInt(data["Autres langues"]);

    return languages;
}
/**
 * Extracts the formats : {"titresPhysiques": 118449, "titresElectroniques": 9863, "autres": 1328}
 * @param {*} data
 * @returns {*} formats
 */
function extractFormats(data) {
    var formats = new Object();
    formats.titresPhysiques = convertToInt(data["Livres"]) + convertToInt(data["Périodiques"]);
    formats.titresElectroniques = convertToInt(data["Audio"]) + convertToInt(data["Vidéo"]) + convertToInt(data["Électronique"]);
    formats.autres = convertToInt(data["Multisupports"]) + convertToInt(data["Autres"]);

    return formats;
}
/**
 * Extracts the localisation : {"latitude": 45.553423, "longitude": -73.662799}
 * @param {*} data
 * @returns {*} localisation
 */
function extractLocalisation(data) {
    var localisation = new Object();
    localisation.latitude = convertToFloat(data["Latitude"]);
    localisation.longitude = convertToFloat(data["Longitude"]);

    return localisation;
}
/**
 * Get the normalized frequentation : frequentations / populationArrondissement
 * @param {*} biblio
 * @returns {float} normalized frequentation
 */
function normalizedFrequentations(biblio) {
    return (biblio.frequentations / biblio.populationArrondissement).toFixed(1);
}
