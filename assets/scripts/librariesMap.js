
// Constants
const mapLat = 45.539699, 
        mapLong = -73.698378,
        mapInitZoom = 11,
        mapMinZoom = 9,
        mapMaxZoom = 16;

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
                        .setView([mapLat, mapLong], mapInitZoom)

        // Create map's background (from OpenStreetmap)
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
            minZoom: mapMinZoom,
            maxZoom: mapMaxZoom,
        }).addTo(libMap);

        this.createSymbols(libMap);
        // Update circles positions on map deplacements or zoom
        libMap.on("moveend", function () { LibrariesMap.update(libMap) });
    }


    /**
     * Creates the svg layer on the map to display the symbols
     * @param libMap : The map
     */
    createSymbols(libMap) {
        // Initialize the svg layer in libMap
        libMap._initPathRoot();
  
        // Make a range for circles radius, proportional to frequentations/population_arrondissement
        var circleRadiusScale = d3.scaleLinear()
            .domain([d3.min(this.libInfoSources, function(d) { return normalizedFrequentations(d); }), 
                     d3.max(this.libInfoSources, function(d) { return normalizedFrequentations(d); })])
            .range([5,18]);
            
        // Tool tip to display the library's name
        var nameToolTip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("background", "white")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("opacity", "0.8")

            // Get the svg to create the symbols at the libs locations
            var svg = d3.select(this.divId).select("svg");

            ///////////////
            var panel = d3.select("#panel");//.style("display", "block"); // TODO
            var panelButton = panel.append("button")
                .text("Fermer")
                .on("click", function () {
                // reset(g);
                panel.style("display", "none");
                circleGroup.selectAll("circle").classed("circle-selected", false);
              });
            //////////////
            
        // Apend the libraries infos data
        var circleGroup = svg.selectAll("circle")
            .data(this.libInfoSources)
            .enter();

        // Draw the circles
        circleGroup.append("circle")
            .attr("r", function(d) { return circleRadiusScale(normalizedFrequentations(d)); })
            .attr("class", "lib-circle")
            .on("mouseover", function(d) {
                return nameToolTip.style("visibility", "visible")
                    .style("top", (d3.event.pageY-30) + "px")
                    .style("left", (d3.event.pageX-30) + "px")
                    .html(d.nom);
            })
            .on("mouseout", function(){ return nameToolTip.style("visibility", "hidden"); })
            .on("click", function(d) {
                nameToolTip.style("visibility", "hidden");
                circleGroup.selectAll("circle").classed("circle-selected", false);
                d3.select(this).classed("circle-selected", true);

                updatePanel(panel, d);
                panel.style("display", "block");

            });

            
        
        // Place the circles
        LibrariesMap.update(libMap);
    }

    /**
     * Updates the circles positions
     * @param {*} libMap : the map
     */
    static update(libMap) {
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
    return value ? parseInt(value.replace(",", "").replace(" ", "")) : undefined;
}
/**
 * Converts string to float
 * @param {string} value
 * @returns {float}
 */
function convertToFloat(value) {
    return parseFloat(value.replace(",", "").replace(" ", ""));
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
/**
 * Updates the info panel html
 * @param {*} panel
 * @param {*} biblio
 */
function updatePanel(panel, biblio) {
    // Get the value normalized by the population in the borough
    var normalized = function (biblio, value) { 
        if (!value) return "-";
        return (value / biblio.populationArrondissement).toFixed(2); }
        
    panel.select("#lib-name").text("Bibliothèque " + biblio.nom);
    panel.select("#nb-h").text("Nombre d'heures d'ouverture par semaine : " + biblio.heuresOuverture + " h/sem");
    panel.select("#surf").text("Surface moyenne par habitant : " + normalized(biblio, biblio.superficie) + " m2");
    panel.select("#nb-titres").text("Nombre de titres par habitant : " + normalized(biblio, biblio.inventaire));
    panel.select("#nb-freq").text("Nombre de visites par habitant : " + normalized(biblio, biblio.frequentations));

    panel.select("#services").text("Types de titres offerts :" + "SVG");
}
