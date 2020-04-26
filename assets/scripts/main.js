/** 
 * Chargement des données
 */

var promises = [];
// Indexes to used for data loading
const dataIndex = {
    "biblio_info" : 0,
    "frequentations" : 1,
    "emp_format" : 2,
    "emp_public" : 3,
    "emp_num_phys" : 4,
    "collection_livres" : 5,
    "collection_format" : 6
}

// Libraries info 2018
promises.push(d3.json("./data/biblio_info_2018.json"));
// Frequentation
promises.push(d3.json("./data/frequentation.json"));
// Emprunts : format
promises.push(d3.json("./data/emprunts_format.json"));
// Emprunts : public
promises.push(d3.json("./data/prets_public.json"));
// Numérique/Automates (public)
promises.push(d3.json("./data/prets_renouv_numerique_physique.json"));
// Collection : public
promises.push(d3.json("./data/collection_livres.json")); 
// Collection : format
promises.push(d3.json("./data/collection_format.json")); 


Promise.all(promises).then(function (results) {

    /*********************
     * M1 - Libraries Map
     *********************/
    // Load Libraries info data
    var libInfoSources = createLibInfoSources(results[dataIndex.biblio_info]);
    
    // Create the libraries map
    var librariesMap = new LibrariesMap("libraries_map", libInfoSources);



    /*****************************************************************
     * M2 - Heatmaps
     * - Frequentation
     * - Emprunts
     * @see https://www.d3-graph-gallery.com/graph/heatmap_basic.html
     *****************************************************************/
    // Number format
    var numberFormat = wNumb({
        thousand: ' ',
    });

    // Margins, size, colors
    var margin = { top: 60, right: 30, bottom: 60, left: 200 },
        width = 500 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

    /** M2.1 - HeatMap Frequentation */
    // Data
    frequentationSources = createFrequentationSources(results[dataIndex.frequentations]);
    
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
    
    /** M2.2 - HeatMap Emprunts */
    // Data
    var empruntsSources = createEmpruntsSources(results[dataIndex.emp_format]);
    var empruntsPublicSources = createEmpruntsSources(results[dataIndex.emp_public]);


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
    

           
    /********************************
     * M3 - Frequentation par public
     ********************************/
    // Data
    let publicLoan2018Sources = createPublicLoan2018Sources(results[dataIndex.emp_public]);
    const bibliotheques = d3.set(publicLoan2018Sources.map(d => d.bibliotheque));

    let selectBiblio = d3.select("#selectBiblio");

    selectBiblio.selectAll('options')
        .data(bibliotheques.values())
        .enter()
        .append('option')
        .text((d) => d);

    /** M3.1 - Public en 2018 */
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

    /** M3.2 - Evolution public */
    // Tip
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

    let sources = createPublicLoanSources(results[dataIndex.emp_public], "(AHC) AHUNTSIC");
    stackedBarPublic.updateData(sources.reverse(), -1);

    selectBiblio.on('change', () => {
        let value = selectBiblio.property('value');
        let sources = createPublicLoanSources(results[dataIndex.emp_public], value);
        stackedBarPublic.updateData(sources.reverse(), -1);
    })


    
    /*****************************************************************
     * M4 - Heatmaps Numerique vs Physique
     * @see https://www.d3-graph-gallery.com/graph/heatmap_basic.html
     *****************************************************************/
    // Number format
    var numberFormat = wNumb({
            thousand: ' ',
        });

    // Margins, size, colors
    var margin = { top: 120, right: 1, bottom: 60, left: 1 },
        width = 75 - margin.left - margin.right,
        height = 1100 - margin.top - margin.bottom;

    // Data
    numeriqueSources = createNumeriqueSources(results[dataIndex.emp_num_phys]);

    // Tip function
    var numeriqueTooltip = function (data) {
        tooltipText = "Bibliothèque: " + data.bibliotheque + '<br>' +
                     "Période: " + data.year + '<br>' +
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
            margin = { top: 80, right: 20, bottom: 60, left: 220 };
            isFirst = true
        } else if (index === tableNameList.length - 1){
            margin =  { top: 80, right: 200, bottom: 60, left: 1 }
        } else if (index % 2){
            margin =  { top: 80, right: 35, bottom: 60, left: 1 }
            isFirst = false
        } else {
            margin =  { top: 80, right: 20, bottom: 60, left: 1 };
            isFirst = false
        }

        var id = "#heatmap_numerique" + (index + 1).toString();
        var heatmapNumerique = new HeatMapNumerique(id, width, height, margin, HeatMapNumerique.createHeatNumerique, HeatMapNumerique.domainYears, HeatMapNumerique.domainBibliotheques, numeriqueTooltip);
        heatmapNumerique.create(numeriqueSources, isFirst, name);

    });



    /************************************************
     * M5 - Connected Dot Plot - Collection vs Loans
     ************************************************/ 
    var marginCD = { top: 10, right: 10, bottom: 100, left: 60 };
    var widthCD = 300 - marginCD.left - marginCD.right;
    var heightCD = 300 - marginCD.top - marginCD.bottom;
    var widthCD_legend = 100;
    
    /***** Scales *****/
    var x = d3.scaleBand().range([0, widthCD]);
    var y = d3.scaleLinear().range([heightCD, 0]);
    
    var svg = d3.select("#ConnectedDotPlot")
    .append("svg")
    .attr("width", widthCD + marginCD.left + marginCD.right)
    .attr("height", heightCD + marginCD.top + marginCD.bottom);
    
    var group = svg.append("g")
    .attr("transform", "translate(" + marginCD.left + "," + marginCD.top + ")");
    
    /***** Get json files data *****/
    var collectionFormat = results[dataIndex.collection_format];
    var pretsFormat = results[dataIndex.emp_format];
    var collectionLivres = results[dataIndex.collection_livres];
    var pretsPublic = results[dataIndex.emp_public];
    
    // Public data type is displayed by default
    var connectedDotPlotSources = createConnectedDotPlotSourcesPublic(collectionLivres, pretsPublic);
    
    /******* M5.1 *******/   
    var lollipopsGroup = group.append("g").attr("class", "lollipops");
    var connectedDotPlot = new ConnectedDotPlot(connectedDotPlotSources);
    var libDropDown = connectedDotPlot.onLibraryDropDownUpdate(connectedDotPlotSources, connectedDotPlotSources[5].year, x, y, group, lollipopsGroup);
    connectedDotPlot.onYearDropDownUpdate(connectedDotPlotSources, x, y, group, libDropDown, lollipopsGroup);
    
    var initialData = connectedDotPlotSources[connectedDotPlotSources.length - 1];
    ConnectedDotPlot.createLibConnectedDotPlot(connectedDotPlotSources, initialData.year, initialData.libraries[0].name,  x, y, group, heightCD, lollipopsGroup, false);
    
    var svgLegend = d3.select("#ConnectedDotPlot")
        .append("svg")
        .attr("width", widthCD_legend + marginCD.left + marginCD.right)
        .attr("height", heightCD + marginCD.top + marginCD.bottom);
    ConnectedDotPlot.legend(svgLegend, widthCD, heightCD);
    
    /******* M5.2 *******/
    var groupMultipleList = [];
    var lollipopsGroupMultipleList = [];
    connectedDotPlotSources[connectedDotPlotSources.length - 1].libraries.forEach(function(d, i) {
        var svgMultiple = d3.select("#MultipleConnectedDotPlots")
        .append("svg")
        .attr("width", widthCD + marginCD.left + marginCD.right)
        .attr("height", heightCD + marginCD.top + marginCD.bottom);
        
        var groupMultiple = svgMultiple.append("g")
        .attr("transform", "translate(" + marginCD.left + "," + marginCD.top + ")");
        groupMultipleList[i] = groupMultiple;
        var lollipopsGroupMultiple = groupMultiple.append("g").attr("class", "lollipops");
        lollipopsGroupMultipleList[i] = lollipopsGroupMultiple;
        ConnectedDotPlot.createLibConnectedDotPlot(connectedDotPlotSources, initialData.year, d.name,  x, y, groupMultiple, heightCD, lollipopsGroupMultiple, true);
    });

    /******* Dropdown and swith default values *******/
    d3.select("#dataTypeButtonPublic").property("checked", "true");
    d3.select("#selectYear").property('value', "2018");

    /******* Switching between format and public *******/
    d3.selectAll(("input[name='dataTypeButton']")).on("change", function() {
        if(this.value == "Public") {
            connectedDotPlotSources = createConnectedDotPlotSourcesPublic(collectionLivres, pretsPublic);
        } else if(this.value == "Format") {
            connectedDotPlotSources = createConnectedDotPlotSourcesFormat(collectionFormat, pretsFormat);
        }

        /***** Main graph and multiple graphs - Update domainX, domainY, dropdowns and lollipops *****/
        ConnectedDotPlot.selectedYear = d3.select("#selectYear").property("value");
        ConnectedDotPlot.selectedLibName = d3.select("#selectLibrary").property("value");
        var libDropDown = connectedDotPlot.onLibraryDropDownUpdate(connectedDotPlotSources, ConnectedDotPlot.selectedYear, x, y, group, lollipopsGroup);
        connectedDotPlot.onYearDropDownUpdate(connectedDotPlotSources, x, y, group, libDropDown, lollipopsGroup);
        ConnectedDotPlot.updateDataLibrary(connectedDotPlotSources, ConnectedDotPlot.selectedYear, ConnectedDotPlot.selectedLibName, x, y, group, lollipopsGroup, false);
        
        var initialData = connectedDotPlotSources[connectedDotPlotSources.length - 1];
        connectedDotPlotSources[connectedDotPlotSources.length - 1].libraries.forEach(function(d, i) {
            ConnectedDotPlot.updateDataLibrary(connectedDotPlotSources, initialData.year, d.name,  x, y, groupMultipleList[i], lollipopsGroupMultipleList[i], true);
        });
    });
})
