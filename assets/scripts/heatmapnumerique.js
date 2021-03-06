HeatMapNumerique = class HeatMapNumerique {

    static startColor = "#ff0016";
    static stopColor = "#14ff00";
    static undefinedColor = "#A9A9A9";

    static titles = {
        "pretsPhysique": "Comptoir",
        "pretsAuto": "Automate",
        "renouvPhysique": "Comptoir",
        "renouvAuto": "Automate",
        "locationPhysique": "Physique",
        "locationNumerique": "Numérique"
    }

    constructor(div, width, height, margin, createFunction, domainX, domainY, tip) {
        this.width = width;
        this.height = height;
        this.margin = margin;

        this.domainX = domainX;
        this.domainY = domainY;

        // Create the SVG
        this.svg = d3.select(div)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // Color scale
        this.colorScale =  d3.scaleThreshold()
            .domain([-2.5, -1, -0.75, -0.5, 0, 0.5, 1, 2.5])
            .range(d3.schemeRdYlGn[9])
            .unknown("#A9A9A9");

        // Create function
        this.createFunction = createFunction;

        // Tip
        this.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-8, 0])
            .html(tip);

        // Axes
        this.x = d3.scaleBand().range([0, width]).padding(0.05);
        this.y = d3.scaleBand().range([height, 0]).padding(0.05);
    }

    create(sources, isFirst, name) {

        this.updateData(sources, isFirst, name);
    }

    updateData(sources, isFirst, name) {
        // Tooltip
        this.svg.call(this.tip);

        this.svg.selectAll("*").remove();

        this.domainX(this.x, sources);
        var xAxis = d3.axisBottom(this.x).tickSize(0);

        this.domainY(this.y, sources);
        var yAxis = d3.axisLeft(this.y).tickSize(0);

        this.addAxes(xAxis, yAxis, isFirst);

        this.svg.append("text")
            .attr("class", "title")
            .attr("x", this.width/2)
            .attr("y", 0 - ((this.margin.top / 2) + 20))
            .attr("text-anchor", "middle")
            .text(HeatMapNumerique.titles[name]);


        this.svg.selectAll().call(this.createFunction, sources, this.x, this.y, this.colorScale, this.tip, name);
        if(name === "locationNumerique") {
            this.addLegend();
        }
    }

    addAxes(xAxis, yAxis, isFirst) {
        // x axis
        this.svg.append("g")
            .attr("class", "x axis")
            .call(xAxis)
            .selectAll("text")
            .attr("font-size", "10px")
            .attr('stroke-opacity', 1)
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("transform", "translate(-10, 0) rotate(-45)");

        this.svg.selectAll("g .x.axis")
            .select('.domain').attr('stroke-opacity', 0);


        // y axis
        if(isFirst) {
            this.svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .attr("font-size", "10px")
                .select('.domain').attr('stroke-opacity', 0);
        }
    }

    /**
     * Creer une legende
    *  @see https://d3-legend.susielu.com/#color
     * @static
     * @param {*} svg
     */
    addLegend() {

        var horizontalTranslation = 120;

        var thresholdLabels = function({
                                           i,
                                           genLength,
                                           generatedLabels,
                                           labelDelimiter
                                       }) {
            if (i === 0) {
                const values = generatedLabels[i].split(` ${labelDelimiter} `)
                return `Moins de ${values[1]}`
            } else if (i === genLength - 1) {
                const values = generatedLabels[i].split(` ${labelDelimiter} `)
                return `${values[0]} ou plus`
            } else {
                const values = generatedLabels[i].split(` ${labelDelimiter} `)
                return `${values[0]} à ${values[1]}`
            }
            return generatedLabels[i]
        }

        this.svg.append("g")
            .attr("class", "legendQuant")
            .attr("transform", ` translate( ${horizontalTranslation} , 0) `);

        var legend = d3.legendColor()
            .labelFormat(d3.format(".0%"))
            .labels(thresholdLabels)
            .useClass(false)
            .title("Légende")
            .scale(this.colorScale);

        this.svg.select(".legendQuant")
            .call(legend);

        //AJOUT DE INDÉFINI
        var indefScale = d3.scaleOrdinal()
            .domain(['Données indisponibles'])
            .range([HeatMapNumerique.undefinedColor] );

        this.svg.append("g")
            .attr("class", "legendIndef")
            .attr("transform", ` translate( ${horizontalTranslation} , 210) `);

        var indefLegend = d3.legendColor()
            .scale(indefScale)
            .orient("vertical")
            .labelWrap(30)

        this.svg.select(".legendIndef")
            .call(indefLegend);



    }

    static domainBibliotheques(y, sources) {
        const bibliotheques = d3.set(sources.map(d => d.bibliotheque));
        y.domain(bibliotheques.values());
    }

    static domainYears(y, sources) {
        y.domain([ 2015, 2016, 2017, 2018, "GLOBAL"]);
    }

    static createHeatNumerique(selection, sources, x, y, colorScale, tip, name) {


        selection.data(sources)
            .enter()
            .append("g")
            .attr("y", d => y(d.bibliotheque))
            .attr("transform", d => "translate(0, " + y(d.bibliotheque) + ")")
            .selectAll("g")
            .data(function (d) {
                var tempObject = d[name];
                tempObject.forEach( yearData => {
                    yearData.bibliotheque = d.bibliotheque
                });
                return tempObject })
            .enter()
            .append("rect")
            .filter(function(d) {return (d.year > 2014 || d.year == "GLOBAL") })
            .attr("x", function (d) { return x(d.year) })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function (d) {

            return isNaN(d.delta) ? HeatMapNumerique.undefinedColor : colorScale(d.delta)

            })
            .attr("class", "heatmap-rect")
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);


    }
}

/**
 * Transforme les données de fréquentation à partir des données json.
 * Format de retour :
 * [
 *     {￼
 *         "nom": "(AHC) AHUNTSIC"
 *         "annee": 2018
 *         "frequentation": [25917, ...],
 *     }, ...
 * ]
 *
 * @param {*} data Données du fichier json
 * @returns {array}
 */
function createNumeriqueSources(data) {
    var sources = [];


    for (const year in data) {
        data[year].forEach(function (d, i) {

            biblioName = d["Bibliotheque"];
            let index;

            if (!alreadyExists(biblioName, sources)){
                var biblio = new Object();
                biblio.bibliotheque = biblioName;
                biblio.pretsPhysique = [];
                biblio.pretsAuto = [];
                biblio.renouvPhysique = [];
                biblio.renouvAuto = [];
                biblio.locationPhysique = [];
                biblio.locationNumerique = [];

                sources.push(biblio);
                index = sources.length - 1
            } else {
                index = sources.findIndex( d => d.bibliotheque ===  biblioName);
            }

            // Recuperer l'arrondissement
            // biblio.arrondissement = getArrondissement(d["Bibliotheque"]);
            const intYear = parseInt(year);


            //PRETS
            const pretsPhysique = new Object();
            pretsPhysique.year = intYear;
            pretsPhysique.count = parseFloat(d["PretsTotal"].split(",").join("")) - parseFloat(d["PretsAuto"].split(",").join(""));
            pretsPhysique.delta = computeDelta(pretsPhysique.year, pretsPhysique.count, sources[index].pretsPhysique);

            const pretsAuto = new Object();
            pretsAuto.year = intYear;
            pretsAuto.count = parseFloat(d["PretsAuto"].split(",").join(""));
            pretsAuto.delta = computeDelta(pretsAuto.year, pretsAuto.count, sources[index].pretsAuto);

            //RENOUVELLEMENTS
            const renouvPhysique = new Object();
            renouvPhysique.year = intYear;
            renouvPhysique.count = parseFloat(d["RenouvTotal"].split(",").join("")) - parseFloat(d["RenouvAuto"].split(",").join(""));
            renouvPhysique.delta = computeDelta(renouvPhysique.year, renouvPhysique.count, sources[index].renouvPhysique);

            const  renouvAuto = new Object();
            renouvAuto.year = intYear;
            renouvAuto.count = parseFloat(d["RenouvAuto"].split(",").join(""));
            renouvAuto.delta = computeDelta(renouvAuto.year, renouvAuto.count, sources[index].renouvAuto);

            //EMPRUNTS DE LIVRES
            const locationPhysique = new Object();
            locationPhysique.year = intYear;
            locationPhysique.count = parseFloat(d["PretPhysique"].split(",").join(""));
            locationPhysique.delta = computeDelta(locationPhysique.year, locationPhysique.count, sources[index].locationPhysique);

            const locationNumerique = new Object();
            locationNumerique.year = intYear;
            locationNumerique.count = parseFloat(d["PretNumerique"].split(",").join(""));
            locationNumerique.delta = computeDelta(locationNumerique.year, locationNumerique.count, sources[index].locationNumerique);


            sources[index].pretsPhysique.push(pretsPhysique);
            sources[index].pretsAuto.push(pretsAuto);
            sources[index].renouvPhysique.push(renouvPhysique);
            sources[index].renouvAuto.push(renouvAuto);
            sources[index].locationPhysique.push(locationPhysique);
            sources[index].locationNumerique.push(locationNumerique);

            if(intYear === 2018){
                sources[index].pretsPhysique.push(computeGlobalDelta(sources[index].pretsPhysique));
                sources[index].pretsAuto.push(computeGlobalDelta(sources[index].pretsAuto));
                sources[index].renouvPhysique.push(computeGlobalDelta(sources[index].renouvPhysique));
                sources[index].renouvAuto.push(computeGlobalDelta(sources[index].renouvAuto));
                sources[index].locationPhysique.push(computeGlobalDelta(sources[index].locationPhysique));
                sources[index].locationNumerique.push(computeGlobalDelta(sources[index].locationNumerique));
            }

        });
    }




    return sources;
}

function alreadyExists(biblioName, biblioList) {
    return biblioList.find( biblio => biblio.bibliotheque === biblioName);
}

function computeDelta(year, count, countList){

    let previousYear = year - 1;

    if(year !== 2014 && !isNaN(count)){
        let previousYearIndex = countList.findIndex( d => d.year === previousYear );
        let previousCount = countList[previousYearIndex].count;
        if (!isNaN(previousCount)) {
            return (count - previousCount)/ previousCount
        }
    } else {
        return NaN
    }

}

function computeGlobalDelta(countList){

    let earliestYear = getExtremeYearWithData(countList, true);
    let latestYear = getExtremeYearWithData(countList, false);

    let globalCount = new Object();
    globalCount.year = "GLOBAL";

    if (earliestYear !== latestYear && !isNaN(earliestYear) && !isNaN(latestYear) ){
        let earliestYearIndex = countList.findIndex( d => d.year === earliestYear );
        let latestYearIndex = countList.findIndex( d => d.year === latestYear );

        globalCount.delta = (countList[latestYearIndex].count - countList[earliestYearIndex].count)/ countList[earliestYearIndex].count

    } else {
        globalCount.delta = NaN
    }

    return globalCount
}

function getExtremeYearWithData(countList, isEarliest){

    if(!isEarliest) {
        countList = countList.reverse();
    }

    for (let data of countList){
        if (!isNaN(data.count)){
            return data.year;
        }
    }
    return NaN;
}