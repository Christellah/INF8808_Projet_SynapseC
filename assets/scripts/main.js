/** 
 * Chargement des données
 */

var promises = [];

// Frequentation
promises.push(d3.json("./data/frequentation.json"));
// Emprunts
promises.push(d3.json("./data/emprunts_format.json"));

Promise.all(promises).then(function (results) {
    /** 
     * Heatmaps
     * - Frequentation
     * - Emprunts
     * @see https://www.d3-graph-gallery.com/graph/heatmap_basic.html
     */

    // Margins, size, colors
    var margin = { top: 60, right: 30, bottom: 60, left: 200 },
        width = 700 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;
    
    /** Frequentation */
    // Data
    frequentationSources = createFrequentationSources(results[0]);

    // Tip function
    var frequentationTooltip = function(data) {
        return data.time + "<br />" + "Frequentation : " + data.count;
    }

    // Max function
    function getMaxFrequentation(sources) {
        return d3.max(sources.map(d => d3.max(d.frequentation, f => f.count)));
    }

    // Create the heatmap
    var heatmapFrequentation = new HeatMap("#heatmap_frequentation", width, height, margin, HeatMap.createHeatMapFrequentation, frequentationTooltip);
    heatmapFrequentation.create(frequentationSources.filter(d => d.annee == 2013), HeatMap.domainMonths, HeatMap.domainBibliotheque, getMaxFrequentation);

    // Choix de l'annee
    d3.select("#yearChoice").on('change', function () {
        var newSources = frequentationSources.filter(d => d.annee == this.value);
        heatmapFrequentation.updateData(newSources, HeatMap.domainMonths, HeatMap.domainBibliotheque, getMaxFrequentation);
    })


    /** HeatMap Emprunts */
    // Data
    var empruntsSources = createEmpruntsSources(results[1]);

    // Tip function
    var empruntsTooltip = function(data) {
        return data.bibliotheque + " en " + data.annee + " : " + data.emprunts.Total + " emprunts.";
    }

    // Max function
    function getMaxEmprunts(sources) {
        console.log(sources);
        return d3.max(sources.map(d => d.emprunts.Total))
    }

    // Create the heatmap
    var heatmapEmprunts = new HeatMap("#heatmap_emprunts", width, height, margin, HeatMap.createHeatMapEmprunts, empruntsTooltip);
    heatmapEmprunts.create(empruntsSources, HeatMap.domainYears, HeatMap.domainBibliotheque, getMaxEmprunts);

})

