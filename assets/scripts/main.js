/** 
 * Chargement des données
 */

var promises = [];

// Frequentation
promises.push(d3.json("./data/frequentation.json"));
// Emprunts (format)
promises.push(d3.json("./data/emprunts_format.json"));
// Emprunts (public)
promises.push(d3.json("./data/prets_public.json"));

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
    var empruntsPublicSources = createEmpruntsSources(results[2]);


    // Tip function
    var empruntsTooltip = function (data) {
        return data.bibliotheque + " en " + data.annee + " : " + numberFormat.to(data.emprunts.TOTAL) + " emprunts.";
    }

    // Max function
    function getMaxEmprunts(sources) {
        return d3.max(sources.map(d => d.emprunts.TOTAL))
    }

    // Create the heatmap
    var heatmapEmprunts = new HeatMap("#heatmap_emprunts", width, height, margin, HeatMap.createHeatMapEmprunts, HeatMap.domainYears, HeatMap.domainBibliotheque, getMaxEmprunts, empruntsTooltip);
    heatmapEmprunts.create(empruntsSources);

    // Valeurs initiales des selecteurs.
    d3.select("#selectFormat").property('value', 'TOTAL');
    d3.select("#selectPublic").property('value', '');

    // Change event
    d3.select("#selectFormat").on('change', function () {
        let value = this.value;

        if (value.length > 0) {
            d3.select("#selectPublic").property('value', '');
            heatmapEmprunts.maxValue = d3.max(empruntsSources.map(d => d.emprunts[value]));

            heatmapEmprunts.setTip(function (data) {
                return data.bibliotheque + " en " + data.annee + " : " + numberFormat.to(data.emprunts[value]) + " emprunts.";
            });

            heatmapEmprunts.updateColorDomain();
            heatmapEmprunts.updateData(empruntsSources);

            // Mettre a jour le fill
            d3.select("#heatmap_emprunts")
                .select("svg")
                .selectAll(".heatmap-rect")
                .style("fill", function (d) { return heatmapEmprunts.colorScale(d.emprunts[value]) });

        }
    });

    d3.select("#selectPublic").on('change', function () {
        let value = this.value;
        
        if (value.length > 0) {
            d3.select("#selectFormat").property('value', '');
            heatmapEmprunts.maxValue = d3.max(empruntsPublicSources.map(d => d.emprunts[value]));
            heatmapEmprunts.setTip(function (data) {
                return data.bibliotheque + " en " + data.annee + " : " + numberFormat.to(data.emprunts[value]) + " emprunts.";
            });
            heatmapEmprunts.updateColorDomain();
            heatmapEmprunts.updateData(empruntsPublicSources);

            d3.select("#heatmap_emprunts")
                .select("svg")
                .selectAll(".heatmap-rect")
                .style("fill", function (d) { return heatmapEmprunts.colorScale(d.emprunts[value]) });
        }

    });

})

