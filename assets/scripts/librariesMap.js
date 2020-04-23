
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
        // Get the svg to create the symbols at the libs locations
        var svg = d3.select(this.divId).select("svg");

        // Apend the libraries infos data
        var circleGroup = svg.append("g")
            .selectAll("circle")
			.data(this.libInfoSources)
            .enter();

        // Draw the circles
        circleGroup.append("circle")
            .attr("r", 14)
			.style("stroke", "black")  
			.style("opacity", .8) 
			.style("fill", "#FE390F");
        
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
 *          "superficie": "2,033.50",
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

 /*
 *          "populationArrondissement": 134245
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
        biblio.superficie = d["Superficie en m2"];
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
    return parseInt(value.replace(",", "").replace(" ", ""));
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
