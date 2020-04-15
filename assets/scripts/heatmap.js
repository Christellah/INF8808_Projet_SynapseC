HeatMap = class HeatMap {
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

    static create(svg, frequentationSources, x, y, colorScale) {
        // Tooltip
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-8, 0])
            .html(HeatMap.getTooltip);
        svg.call(tip);

        // Create the heatmap
        svg.selectAll()
            .data(frequentationSources)
            .enter()
            .append("g")
            .attr("y", d => y(d.bibliotheque))
            .attr("transform", d => "translate(0, " + y(d.bibliotheque) + ")")
            .selectAll("g")
            .data(function (d, i, j) { return d.frequentation })
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

    static domainBibliotheque(y, sources) {
        const bibliotheques = d3.set(sources.map(d => d.bibliotheque));
        y.domain(bibliotheques.values());
    }

    static domainX(x) {
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

    static getMaxFrequentation(sources) {
        var maxLocaux = sources.map(d => d3.max(d.frequentation, f => f.count));
        return d3.max(maxLocaux);
    }

    static getTooltip(data) {
        return data.time + "<br />" + "Frequentation : " + data.count;
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
 * {
 *      "2012": [
 *          {
 *              "frequentation": ["25,917", ...],
 *              "nom": "(AHC) AHUNTSIC"
*           }, ...
 *      ],
 *      ...
 * }
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