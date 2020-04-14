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
    var margin = { top: 30, right: 30, bottom: 30, left: 200 },
        width = 1024 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

    // Create the svg
    var svg = HeatMap.createSVG("#heatmap_frequentation", width, height, margin);

    // Build X and Y axis
    var x = d3.scaleBand().range([0, width]);
    HeatMap.domainX(x);
    xAxis = d3.axisBottom(x);    

    var y = d3.scaleBand().range([height, 0]);
    HeatMap.domainBibliotheque(y, frequentationSources);
    yAxis = d3.axisLeft(y);

    // Add the axes
    HeatMap.addAxes(svg, xAxis, yAxis);

    // Build color scale
    var colorScale = d3.scaleLinear()
        .range(["#fff2e0", "#ff9100"]);
    HeatMap.domainColor(colorScale, frequentationSources);

    // Create the heatmap
    HeatMap.create(svg, frequentationSources, x, y, colorScale);
})

