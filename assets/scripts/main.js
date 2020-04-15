/** 
 * Chargement des données
 */

var promises = [];

// Frequentation
promises.push(d3.json("./data/frequentation.json"));

Promise.all(promises).then(function (results) {
    frequentationJson = results[0];

    frequentationSources = createFrequentationSources(frequentationJson);

/**
 * Heatmap fréquentation
 * @see https://www.d3-graph-gallery.com/graph/heatmap_basic.html
 */
    var margin = { top: 50, right: 30, bottom: 30, left: 200 },
        width = 1024 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

    // Create the svg
    var svg = HeatMap.createSVG("#heatmap_frequentation", width, height, margin);

    // Build X and Y axis
    var x = d3.scaleBand().range([0, width]);
    HeatMap.domainX(x);
    xAxis = d3.axisBottom(x).tickSize(0);    

    var y = d3.scaleBand().range([height, 0]);
    HeatMap.domainBibliotheque(y, frequentationSources);
    yAxis = d3.axisLeft(y).tickSize(0);

    // Add the axes
    HeatMap.addAxes(svg, xAxis, yAxis);

    // Build color scale
    let startColor = "#fff2e0";
    let stopColor = "#ff9100";
    let maxFrequentation = HeatMap.getMaxFrequentation(frequentationSources);
    var colorScale = d3.scaleLinear()
        .range([startColor, stopColor])
        .domain([0, maxFrequentation]);

    // Create the heatmap
    HeatMap.create(svg, frequentationSources, x, y, colorScale);
    HeatMap.createLegend("#heatmap_frequentation_legend", 300, 50, startColor, stopColor, maxFrequentation);
})

