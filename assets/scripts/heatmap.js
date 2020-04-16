HeatMap = class HeatMap {

    static create(div, width, height, margin, sources, domainX, domainY, colorScale, tipHTML) {
        // Create the svg
        var svg = HeatMap.createSVG(div, width, height, margin);

        // Build X and Y axis
        var x = d3.scaleBand().range([0, width]);
        domainX(x, sources);
        var xAxis = d3.axisBottom(x).tickSize(0);

        var y = d3.scaleBand().range([height, 0]);
        domainY(y, sources)
        var yAxis = d3.axisLeft(y).tickSize(0);

        // Add the axes
        HeatMap.addAxes(svg, xAxis, yAxis);

        // Tooltip
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-8, 0])
            .html(tipHTML);
        svg.call(tip);

        // Create the heatmap
        svg.selectAll()
            .data(sources)
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

    // TODO: Merger create et create2
    static create2(div, width, height, margin, sources, domainX, domainY, colorScale, tipHTML) {
        // Create the svg
        var svg = HeatMap.createSVG(div, width, height, margin);

        // Build X and Y axis
        var x = d3.scaleBand().range([0, width]);
        domainX(x, sources);
        var xAxis = d3.axisBottom(x).tickSize(0);

        var y = d3.scaleBand().range([height, 0]);
        domainY(y, sources)
        var yAxis = d3.axisLeft(y).tickSize(0);

        // Add the axes
        HeatMap.addAxes(svg, xAxis, yAxis);

        // Tooltip
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-8, 0])
            .html(tipHTML);
        svg.call(tip);

        // Create the heatmap
        svg.selectAll()
            .data(sources)
            .enter()
            .append("rect")
            .attr("x", d => x(d.annee))
            .attr("y", d => y(d.bibliotheque))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function (d) { return colorScale(d.emprunts.Total) })
            .attr("class", "heatmap-rect")
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);
    }

    /**
     * Creer une legende
    *  @see https://bl.ocks.org/duspviz-mit/9b6dce37101c30ab80d0bf378fe5e583
     * @static
     * @param {*} svg
     */
    static createLegend(div, width, height, startColor, stopColor, max) {
        var svg = d3.select(div).append("svg")
            .attr("width", width)
            .attr("height", height);

        var legend = svg.append("defs")
            .append("svg:linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");

        legend.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", startColor)

        legend.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", stopColor)

        svg.append("rect")
            .attr("width", width)
            .attr("height", height - 30)
            .style("fill", "url(#gradient)");

        var y = d3.scaleLinear()
            .range([300, 0])
            .domain([max, 0]);

        var yAxis = d3.axisBottom()
            .scale(y)
            .ticks(5);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,30)")
            .call(yAxis)
            .append("text")
            .attr("y", 0)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("axis title");

        svg.attr("transform", "rotate(-90) translate(-200, -100)");
    }

    static months() {
        return ["JA", "FE", "MR", "AL", "MI", "JN", "JL", "AU", "SE", "OC", "NO", "DE"];
    }

    static createSVG(div, width, height, margin) {
        return d3.select(div)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    }

    static addAxes(svg, xAxis, yAxis) {
        // x axis
        svg.append("g")
            .call(xAxis)
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("transform", "rotate(-45)");

        // y axis
        svg.append("g")
            .call(yAxis);
    }

    static domainBibliotheque(y, sources) {
        const bibliotheques = d3.set(sources.map(d => d.bibliotheque));
        y.domain(bibliotheques.values());
    }

    static domainMonths(x, sources) {
        var domain = [];
        var months = HeatMap.months();
        var a;
        for (a = 2013; a <= 2018; a++) {
            months.forEach(function (m, n) {
                domain.push(m + " " + a);
            });
        }

        x.domain(domain);
    }

    static domainYears(y, sources) {
        y.domain([2013, 2014, 2015, 2016, 2017, 2018]);
    }    
}

/**
 * Transforme une chaîne de caractère en nombre entier.
 * La chaîne doit déjà représenter un entier dont les miliers 
 * séparés par des virgules.
 * @param {*} value
 * @returns {int}
 */
function convertFrequentationValue(value) {
    return parseInt(value.replace(",", ""));
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

    for (const year in data) {
        data[year].forEach(function (d, i) {
            var biblio = new Object();
            biblio.bibliotheque = d["Bibliotheque"];
            biblio.annee = parseInt(year);
            biblio.frequentation = [];

            mois.forEach(function (m, n) {
                if (d[m] !== undefined) {
                    var freq = new Object();
                    freq.time = mois[n] + " " + year;
                    freq.count = convertFrequentationValue(d[m]);
                    biblio.frequentation.push(freq);
                }
            });

            sources.push(biblio);
        });
    }

    return sources;
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
            biblio.bibliotheque = d["Bibliotheque"];
            delete d["Bibliotheque"];
            biblio.annee = parseInt(year);
            biblio.emprunts = new Object();

            for (const attribute in d) {
                biblio.emprunts[attribute] = parseInt(d[attribute]);
            }
            sources.push(biblio);
        });
    }

    return sources;
}