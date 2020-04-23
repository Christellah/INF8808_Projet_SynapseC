/** 
 * Chargement des données
 */

var promises = [];

// Frequentation
promises.push(d3.json("./data/frequentation.json"));
// Emprunts
promises.push(d3.json("./data/emprunts_format.json"));

// Maquette 5
promises.push(d3.json("/data/collection_livres.json")); 
// promises.push(d3.json("/data/collection_format.json")); 
promises.push(d3.json("/data/prets_public.json")); 


Promise.all(promises).then(function (results) {
    /** 
     * Heatmaps
     * - Frequentation
     * - Emprunts
     * @see https://www.d3-graph-gallery.com/graph/heatmap_basic.html
     */
    // Number format
    var numberFormat = wNumb({
        thousand: ' ',
    });

    // Margins, size, colors
    var margin = { top: 60, right: 30, bottom: 60, left: 200 },
        width = 500 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

    /** Frequentation */
    // Data
    frequentationSources = createFrequentationSources(results[0]);
    
    // Tip function
    var frequentationTooltip = function (data) {
        return data.time + "<br />" + "Frequentation : " + numberFormat.to(data.count);
    }
    
    // Max function
    function getMaxFrequentation(sources) {
        return d3.max(sources.map(d => d3.max(d.frequentation, f => f.count)));
    }
    
    // Create the heatmap
    var heatmapFrequentation = new HeatMap("#heatmap_frequentation", width, height, margin, HeatMap.createHeatMapFrequentation, HeatMap.domainMonths, HeatMap.domainBibliotheque, getMaxFrequentation, frequentationTooltip);
    heatmapFrequentation.create(frequentationSources);
    heatmapFrequentation.updateData(frequentationSources.filter(d => d.annee == 2013));
    
    // Choix de l'annee
    var yearChoice = document.getElementById('yearChoice');
    noUiSlider.create(yearChoice, {
        range: {
            min: 2013,
            max: 2018
        },
        step: 1,
        start: [2013],
        pips: { mode: 'steps', density: 15, filter: d => 1},
        format: wNumb({
            decimals: 0,
        })
    });
    
    yearChoice.noUiSlider.on('change', function () {
        var newSources = frequentationSources.filter(d => d.annee == this.get());
        heatmapFrequentation.updateData(newSources);
        
    })
    
    /** HeatMap Emprunts */
    // Data
    var empruntsSources = createEmpruntsSources(results[1]);
    
    // Tip function
    var empruntsTooltip = function (data) {
        return data.bibliotheque + " en " + data.annee + " : " + numberFormat.to(data.emprunts.Total) + " emprunts.";
    }

    // Max function
    function getMaxEmprunts(sources) {
        return d3.max(sources.map(d => d.emprunts.Total))
    }

    // Create the heatmap
    var heatmapEmprunts = new HeatMap("#heatmap_emprunts", width, height, margin, HeatMap.createHeatMapEmprunts, HeatMap.domainYears, HeatMap.domainBibliotheque, getMaxEmprunts, empruntsTooltip);
    heatmapEmprunts.create(empruntsSources);

    d3.select("#selectFormat").on('change', function () {
        let value = this.value;
        heatmapEmprunts.maxValue = d3.max(empruntsSources.map(d => d.emprunts[value]));

        heatmapEmprunts.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-8, 0])
            .html(function (data) {
                return data.bibliotheque + " en " + data.annee + " : " + numberFormat.to(data.emprunts[value]) + " emprunts.";
            });

        heatmapEmprunts.colorScale.domain([0, heatmapEmprunts.maxValue]);

        heatmapEmprunts.updateData(empruntsSources);

        d3.select("#heatmap_emprunts")
            .select("svg")
            .selectAll(".heatmap-rect")
            .style("fill", function (d) { return heatmapEmprunts.colorScale(d.emprunts[value]) })
    });


    /*
    * Maquette 5 - Connected Dot Plot
     */ 

    var collectionLivres = results[2];
    // var collectionFormat = results[3];
    var pretsPublic = results[3];

    var marginCD = {
        top: 10,
        right: 10,
        bottom: 100,
        left: 60
    };

    var widthCD = 300 - marginCD.left - marginCD.right;
    var heightCD = 300 - marginCD.top - marginCD.bottom;

    /***** Scales *****/
    var x = d3.scaleBand().range([0, widthCD]);
    var y = d3.scaleLinear().range([heightCD, 0]);

    var svg = d3.select("#ConnectedDotPlot")
        .append("svg")
        .attr("width", widthCD + marginCD.left + marginCD.right)
        .attr("height", heightCD + marginCD.top + marginCD.bottom);

        var group = svg.append("g")
        .attr("transform", "translate(" + marginCD.left + "," + marginCD.top + ")");
    
    var publicCDPlotSources = createConnectedDotPlotSources(collectionLivres, pretsPublic);

    var connectedDotPlot = new ConnectedDotPlot(publicCDPlotSources);
    
    connectedDotPlot.createYearDropDown(publicCDPlotSources, x, y, group, heightCD);

})

