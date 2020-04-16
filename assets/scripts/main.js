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
    var margin = { top: 50, right: 30, bottom: 30, left: 200 },
        width = 1024 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;
    var startColor = "#fff2e0";
    var stopColor = "#ff9100";
    
    /** Frequentation */
    // Data
    frequentationJson = results[0];
    frequentationSources = createFrequentationSources(frequentationJson);

    // Color scale
    var maxFrequentation = d3.max(frequentationSources.map(d => d3.max(d.frequentation, f => f.count)));
    var colorScale = d3.scaleLinear()
        .range([startColor, stopColor])
        .domain([0, maxFrequentation]);

    // Tip function
    var frequentationTooltip = function(data) {
        return data.time + "<br />" + "Frequentation : " + data.count;
    }

    // Create the heatmap
    HeatMap.create("#heatmap_frequentation", width, height, margin, frequentationSources, HeatMap.domainMonths, HeatMap.domainBibliotheque, colorScale, frequentationTooltip)
    HeatMap.createLegend("#heatmap_frequentation_legend", 300, 50, startColor, stopColor, maxFrequentation);


    /** HeatMap Emprunts */
    // Data
    var empruntsSources = createEmpruntsSources(results[1]);

    // Color scale
    var maxEmprunts = d3.max(empruntsSources.map(d => d.emprunts.Total));
    var colorScale = d3.scaleLinear()
        .range([startColor, stopColor])
        .domain([0, maxEmprunts]);

    // Tip function
    var empruntsTooltip = function(data) {
        return data.bibliotheque + " en " + data.annee + " : " + data.emprunts.Total + " emprunts.";
    }

    // Create the heatmap
    HeatMap.create2("#heatmap_emprunts", width, height, margin, empruntsSources, HeatMap.domainYears, HeatMap.domainBibliotheque, colorScale, empruntsTooltip);
    HeatMap.createLegend("#heatmap_emprunts_legend", 300, 50, startColor, stopColor, maxEmprunts);


})

