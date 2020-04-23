/** 
 * Chargement des données
 */

var promises = [];

// Frequentation
promises.push(d3.json("./data/frequentation.json"));
// Emprunts
promises.push(d3.json("./data/emprunts_format.json"));
// Prets selon public
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

    /* Frequentation par public */
    // Data
    let publicLoan2018Sources = createPublicLoan2018Sources(results[2]);
    const bibliotheques = d3.set(publicLoan2018Sources.map(d => d.bibliotheque));

    let selectBiblio = d3.select("#selectBiblio");

    selectBiblio.selectAll('options')
        .data(bibliotheques.values())
        .enter()
        .append('option')
        .text((d) => d);

    // Tip
    let stackedBarPublic2018Tip = function(d) {
        let publicType = "";
        switch (d.key) {
            case "adultes":
                publicType = "d'adultes";
                break;
            case "jeunes":
                publicType = "de jeunes";
                break;
            case "aines":
                publicType = "d'aînés";
                break;
            case "org":
                publicType = "d'organsimes et de projets";
                break;
            case "autres":
                publicType = "d'autres";
                break;
        }
        let pourcentage = ((d[1] - d[0])*100).toFixed(2);
        return "Pourcentage " + publicType + " à la bibliothèque " + d.data.bibliotheque + " en 2018 : " + pourcentage + "%";
    }

    let stackedBarPublic2018 = new StackedBar("#emprunts_biblio_2018", width, height, margin, StackedBar.createStackedBarBiblios, StackedBar.domainBibliotheque, stackedBarPublic2018Tip, "2018");
    stackedBarPublic2018.updateData2018(publicLoan2018Sources.reverse(), -1);

    let stackedBarPublicTip = function(d) {
        let publicType = "";
        switch (d.key) {
            case "adultes":
                publicType = "d'adultes";
                break;
            case "jeunes":
                publicType = "de jeunes";
                break;
            case "aines":
                publicType = "d'aînés";
                break;
            case "org":
                publicType = "d'organsimes et de projets";
                break;
            case "autres":
                publicType = "d'autres";
                break;
        }
        let pourcentage = ((d[1] - d[0])*100).toFixed(2);
        return "Pourcentage " + publicType + " à la bibliothèque " + selectBiblio.property('value') + " en " + d.data.annee + " : " + pourcentage + "%";
    }

    let stackedBarPublic = new StackedBar("#emprunts_biblio", width, height/8, margin, StackedBar.createStackedBarBiblios, StackedBar.domainYears, stackedBarPublicTip, "");

    let sources = createPublicLoanSources(results[2], "(AHC) AHUNTSIC");
    stackedBarPublic.updateData(sources.reverse(), -1);

    selectBiblio.on('change', () => {
        let value = selectBiblio.property('value');
        let sources = createPublicLoanSources(results[2], value);
        stackedBarPublic.updateData(sources.reverse(), -1);
    })

})

