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
// Libraries info
promises.push(d3.json("./data/biblio_info_2018.json"));
// Numérique/Automates (public)
promises.push(d3.json("./data/prets_renouv_numerique_physique.json"));

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

    /** 
     * Libraries Map
     */
    // Margins, size, colors
    // var margin = { top: 60, right: 30, bottom: 60, left: 200 },
    //     width = 500 - margin.left - margin.right,
    //     height = 800 - margin.top - margin.bottom;

    // Load Libraries info data
    var libInfoSources = createLibInfoSources(results[3]);
    // console.log(libInfoSources);

    // // Tip function
    // var frequentationTooltip = function (data) {
    //     return data.time + "<br />" + "Frequentation : " + numberFormat.to(data.count);
    // }

    // // Max function
    // function getMaxFrequentation(sources) {
    //     return d3.max(sources.map(d => d3.max(d.frequentation, f => f.count)));
    // }
    // Create the libraries map
    var librariesMap = new LibrariesMap("libraries_map", libInfoSources);
    // var heatmapFrequentation = new HeatMap("#heatmap_frequentation", width, height, margin, HeatMap.createHeatMapFrequentation, HeatMap.domainMonths, HeatMap.domainBibliotheque, getMaxFrequentation, frequentationTooltip);
    // heatmapFrequentation.create(frequentationSources);
    // heatmapFrequentation.updateData(frequentationSources.filter(d => d.annee == 2013));

    
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
                publicType = "les adultes";
                break;
            case "jeunes":
                publicType = "les jeunes";
                break;
            case "aines":
                publicType = "les aînés";
                break;
            case "org":
                publicType = "les organsimes et les projets";
                break;
            case "autres":
                publicType = "les autres";
                break;
        }
        let pourcentage = ((d[1] - d[0])*100).toFixed(2);
        return "Pourcentage d'emprunts effectués par " + publicType + " à la bibliothèque " + d.data.bibliotheque + " en 2018 : " + pourcentage + "%";
    }

    let stackedBarPublic2018 = new StackedBar("#emprunts_biblio_2018", width, height, margin, StackedBar.createStackedBarBiblios, StackedBar.domainBibliotheque, stackedBarPublic2018Tip, "2018");

    stackedBarPublic2018.updateData2018(publicLoan2018Sources.reverse(), -1);

    let stackedBarPublicTip = function(d) {
        let publicType = "";
        switch (d.key) {
            case "adultes":
                publicType = "les adultes";
                break;
            case "jeunes":
                publicType = "les jeunes";
                break;
            case "aines":
                publicType = "les aînés";
                break;
            case "org":
                publicType = "les organsimes et les projets";
                break;
            case "autres":
                publicType = "les autres";
                break;
        }
        let pourcentage = ((d[1] - d[0])*100).toFixed(2);
        return "Pourcentage d'emprunts effectués par " + publicType + " à la bibliothèque " + selectBiblio.property('value') + " en " + d.data.annee + " : " + pourcentage + "%";
    }

    let stackedBarPublic = new StackedBar("#emprunts_biblio", width, height/8, margin, StackedBar.createStackedBarBiblios, StackedBar.domainYears, stackedBarPublicTip, "");

    let sources = createPublicLoanSources(results[2], "(AHC) AHUNTSIC");
    stackedBarPublic.updateData(sources.reverse(), -1);

    selectBiblio.on('change', () => {
        let value = selectBiblio.property('value');
        let sources = createPublicLoanSources(results[2], value);
        stackedBarPublic.updateData(sources.reverse(), -1);
    })

    //////////////////////////////////////////
    /**
     * Heatmaps_Numerique
     * - Prets
     * - Renouvellements
     * @see https://www.d3-graph-gallery.com/graph/heatmap_basic.html
     */
        // Number format
    var numberFormat = wNumb({
            thousand: ' ',
        });

    // Margins, size, colors
    var margin = { top: 120, right: 1, bottom: 60, left: 1 },
        width = 120 - margin.left - margin.right,
        height = 1400 - margin.top - margin.bottom;

    /** Frequentation */
    // Data
    numeriqueSources = createNumeriqueSources(results[4]);

    // Tip function
    var numeriqueTooltip = function (data) {

        tooltipText = "Bibliothèque: " + data.bibliotheque + '<br>' +
                     "Annee: " + data.year + '<br>' +
                    "Pourcentage de variation: ";

        if(!isNaN(data.delta)) {
            var format = d3.format(".2%");
            tooltipText += format(data.delta)
        }else {
            tooltipText += "Information indisponible"
        }

        return tooltipText;
    };

    var tableNameList = ["pretsPhysique", "pretsAuto", "renouvPhysique", "renouvAuto", "locationPhysique", "locationNumerique"];

    // Create the heatmap

    tableNameList.forEach( (name, index) => {

        //On définit les marges en fonction de l'index du graphe
        if (index == 0) {
            margin = { top: 80, right: 40, bottom: 60, left: 220 };
            isFirst = true
        } else if (index === tableNameList.length - 1){
            margin =  { top: 80, right: 200, bottom: 60, left: 1 }
        } else if (index % 2){
            margin =  { top: 80, right: 70, bottom: 60, left: 1 }
            isFirst = false
        } else {
            margin =  { top: 80, right: 40, bottom: 60, left: 1 };
            isFirst = false
        }

        var id = "#heatmap_numerique" + (index + 1).toString();
        var heatmapNumerique = new HeatMapNumerique(id, width, height, margin, HeatMapNumerique.createHeatNumerique, HeatMapNumerique.domainYears, HeatMapNumerique.domainBibliotheques, numeriqueTooltip);
        heatmapNumerique.create(numeriqueSources, isFirst, name);

    });



})

