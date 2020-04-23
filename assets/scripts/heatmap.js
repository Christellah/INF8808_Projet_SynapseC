HeatMap = class HeatMap {

    static startColor = "#2d7bb6";
    static middleColor = "#ffff8c";
    static stopColor = "#d7191c";

    constructor(div, width, height, margin, createFunction, domainX, domainY, getMax, tip) {
        this.width = width;
        this.height = height;

        this.domainX = domainX;
        this.domainY = domainY;
        this.getMax = getMax;

        // Create the SVG
        this.svg = d3.select(div)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
                
        // Color scale
        this.colorScale = d3.scaleLinear().range([HeatMap.startColor, HeatMap.middleColor, HeatMap.stopColor]);

        // Create function
        this.createFunction = createFunction;

        // Tip
        this.setTip(tip);

        // Axes
        this.x = d3.scaleBand().range([0, width]);
        this.y = d3.scaleBand().range([height, 0]);
    }

    setTip(tip) {
        this.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-8, 0])
            .html(tip);
    }

    updateColorDomain() {
        this.colorScale.domain([0, this.maxValue / 2, this.maxValue]);
    }

    create(sources) {
        // Sauvegarder la valeur max
        this.maxValue = this.getMax(sources);

        this.updateColorDomain();
        // this.colorScale.domain([0, this.getMax(sources) / 2, this.getMax(sources)]);
        this.updateData(sources);
    }

    updateData(sources) {
        // Tooltip
        this.svg.call(this.tip);

        this.svg.selectAll("*").remove();

        this.domainX(this.x, sources);
        var xAxis = d3.axisBottom(this.x).tickSize(0);

        this.domainY(this.y, sources)
        var yAxis = d3.axisLeft(this.y).tickSize(0);
        
        this.addAxes(xAxis, yAxis);
        this.svg.selectAll().call(this.createFunction, sources, this.x, this.y, this.colorScale, this.tip);

        this.addLegend();
    }

    addAxes(xAxis, yAxis) {
        // x axis
        this.svg.append("g")
            .attr("class", "x axis")
            .call(xAxis)
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("transform", "translate(-10, 0) rotate(-45)");

        // y axis
        this.svg.append("g")
        .attr("class", "y axis")
            .call(yAxis);
    }

    /**
     * Creer une legende
    *  @see https://bl.ocks.org/duspviz-mit/9b6dce37101c30ab80d0bf378fe5e583
     * @static
     * @param {*} svg
     */
    addLegend() {
        var svgLegend = this.svg.append("svg");

        var legend = svgLegend.append("defs")
            .append("svg:linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");

        legend.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", HeatMap.startColor)

        legend.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", HeatMap.middleColor)

        legend.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", HeatMap.stopColor)

        svgLegend.append("rect")
            .attr("width", this.width)
            .attr("height", 20)
            .style("fill", "url(#gradient)")
            .attr("transform", "translate(0, " + (this.height + 10) + ")");

        var y = d3.scaleLinear()
            .range([this.width, 0])
            .domain([this.maxValue, this.maxValue / 2, 0]);

        var yAxis = d3.axisBottom()
            .scale(y)
            .ticks(5);

        svgLegend.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0, " + (this.height + 30) + ")")
            .call(yAxis)
            .append("text")
            .attr("y", 0)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("axis title")
            ;


    }

    static months() {
        return ["JA", "FE", "MR", "AL", "MI", "JN", "JL", "AU", "SE", "OC", "NO", "DE"];
    }        

    static domainBibliotheque(y, sources) {
        const bibliotheques = d3.set(sources.map(d => d.bibliotheque));
        y.domain(bibliotheques.values());
    }

    static domainMonths(x, sources) {
        var years = d3.set(sources.map(d => d.annee)).values();
        var domain = years.map(a => HeatMap.months().map(m => m + " " + a)).flat();
        x.domain(domain);
    }

    static domainYears(y, sources) {
        y.domain([2013, 2014, 2015, 2016, 2017, 2018]);
    }

    static createHeatMapFrequentation(selection, sources, x, y, colorScale, tip) {       
        selection.data(sources)
            .enter()
            .append("g")
            .attr("y", d => y(d.bibliotheque))
            .attr("transform", d => "translate(0, " + y(d.bibliotheque) + ")")
            .selectAll("g")
            .data(function (d) { return d.frequentation })
            .enter()
            .append("rect")
            .attr("x", function (d) { return x(d.time) })            
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function (d) { return colorScale(d.count) })
            .attr("class", "heatmap-rect")
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);           
    }

    static createHeatMapEmprunts(selection, sources, x, y, colorScale, tip) {
        selection.data(sources)
        .enter()
            .append("rect")
            .attr("x", d => x(d.annee))
            .attr("y", d => y(d.bibliotheque))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function (d) { return colorScale(d.emprunts.TOTAL) })
            .attr("class", "heatmap-rect")
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);
    }
}

/**
 * Transforme les données de fréquentation à partir des données json.
 * Format de retour :
 * [
 *     {
 *         "nom": "(AHC) AHUNTSIC"
 *         "annee": 2018
 *         "frequentation": [25917, ...],
 *     }, ...
 * ]
 *
 * @param {*} data Données du fichier json
 * @returns {array}
 */
function createFrequentationSources(data) {
    var sources = [];
    var mois = HeatMap.months();

    // Creer le tableau de sources
    for (const year in data) {
        data[year].forEach(function (d, i) {
            var biblio = new Object();
            biblio.bibliotheque = d["Bibliotheque"];

            // Recuperer l'arrondissement
            biblio.arrondissement = getArrondissement(d["Bibliotheque"]);

            biblio.annee = parseInt(year);
            biblio.frequentation = [];

            biblio.total = 0;
            mois.forEach(function (m, n) {
                if (d[m] !== undefined) {
                    var freq = new Object();
                    freq.time = mois[n] + " " + year;
                    freq.count = parseInt(d[m].replace(",", ""));
                    biblio.frequentation.push(freq);

                    biblio.total += freq.count;
                }
            });

            sources.push(biblio);
        });
    }

    // Trier
/*     return sources.sort(function(a, b) {
        return d3.descending(a.arrondissement, b.arrondissement);
    }); */

    return sources.sort(function(a, b) {
        return a.total - b.total;
    });
}

/**
 * Transforme les données d'emprunts à partir des données json.
 * Format de retour :
 * [
 *     {
 *         "nom": "(AHC) AHUNTSIC"
 *         "annee": 2018
 *         "emprunts": {"Nouveautés": 25143, ...},
 *     }, ...
 * ]
 *
 * @param {*} data Données du fichier json
 * @returns {array}
 */
function createEmpruntsSources(data) {
    var sources = [];

    for (const year in data) {
        data[year].forEach(function (d, i) {
            var biblio = new Object();
            biblio.bibliotheque = d["BIBLIOTHÈQUE"];
            biblio.annee = parseInt(year);
            biblio.emprunts = new Object();

            for (const attribute in d) {
                biblio.emprunts[attribute] = parseInt(d[attribute].toString().replace(",", ""));
            }
            sources.push(biblio);
        });
    }

    return sources.sort(function(a, b) {
        return a.emprunts["TOTAL"] - b.emprunts["TOTAL"];
    });
}

function getArrondissement(nomBibliotheque) {
    let regexp = /\(...\)/g;
    let matches = nomBibliotheque.match(regexp);
    if (matches !== null) {
        return matches[0].replace("(", "").replace(")", "");
    } else {
        return nomBibliotheque;
    }
}