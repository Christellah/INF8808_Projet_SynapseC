StackedBar = class StackedBar {

    constructor(div, width, height, margin, createFunction, domainY) {
        this.width = 500;
        this.height = height;
        this.createFunction = createFunction;
        this.domainY = domainY;

        this.colorScale = d3.scaleOrdinal().domain(StackedBar.public()).range(StackedBar.colors());

        this.x = d3.scaleLinear().range([0, 600])
        this.y = d3.scaleBand().range([height, 0]);

        this.stack = d3.stack().offset(d3.stackOffsetExpand);

        this.svg = d3.select(div)
            .append("svg")
            .attr("width", "1000")
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top/2 + ")");
    }

    static years() {
        return [2013, 2014, 2015, 2016, 2017, 2018]
    }

    static domainBibliotheque(y, sources) {
        const bibliotheques = d3.set(sources.map(d => d.bibliotheque));
        y.domain(bibliotheques.values());
    }

    static colors() {
        return ["#591AEF", "#A1D9D6", "#F8A52B", "#fe390f", "#01462A"]
    }

    static public() {
        return ["adultes", "jeunes", "aines", "org", "autres"]
    }

    static createStackedBarBiblios(selection, sources, x, y, colorScale) {

        selection.data(sources)
                .enter()
                .append("g")
                .selectAll("rect")
                .data(d => d)
                .join("rect")
                .attr("x", d => x(d[0]))
                .attr("y", (d, i) => y(d.data.bibliotheque))
                .attr("width", d => x(d[1]) - x(d[0]))
                .attr("height", y.bandwidth())
                .attr("stroke", "#333333")
                .attr("stroke-width",0.7)
                .attr("fill", d => colorScale(d.key))
                .attr("fill-opacity", 0.9)
                .append("title")
    }

    create(sources) {
        this.updateData(sources, -1);
    }

    updateData(sources, index) {
        this.svg.selectAll("*").remove();
        this.domainY(this.y, sources);
        let yAxis = d3.axisLeft(this.y).tickSize(0);
        this.addAxes(yAxis);
        let series = d3.stack()
            .keys(Object.keys(sources[0]).slice(3, 8))
            .offset(d3.stackOffsetExpand)
            (sources)
            .map(d => (d.forEach(v => v.key = d.key), d));
        this.svg.selectAll().call(this.createFunction, series, this.x, this.y, this.colorScale);
        this.addLegend(this.colorScale, sources, index);
    }

    addAxes(yAxis) {
        // y axis
        this.svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", "translate(-15, 0)");

    }

    addLegend(colorScale, sources, index) {
        let legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(600,30)")
            .style("font-size", "12px");

        legend.append("rect")
            .attr("transform","translate(40,-10)")
            .attr("width", 170)
            .attr("height", 250)
            .attr("opacity",0)
            .attr("fill", "#FFFFFF");

        legend = legend.selectAll(".colors")
            .data(colorScale.domain())
            .enter();

        legend.append("rect")
            .attr("x", 55)
            .attr("y", (d, i) => 15*i)
            .attr("id", (_, i) => { return "Color-" + i})
            .attr("class", "legendColors")
            .attr("width", 10)
            .attr("height", 10)
            .attr("stroke","#000000")
            .attr("fill", (d) => colorScale(d))
            .classed("selected", (d, i) => index === i)
            .on("click", (d, i) => {

                if (d3.select("#Color-"+i).attr("class") === "legendColors selected") {
                    d3.selectAll('.legendColors').classed("selected", false);
                    sources = sources.sort((a, b) => { return b.bibliotheque.localeCompare(a.bibliotheque); });
                    this.updateData(sources, -1);
                } else {
                    d3.selectAll('.legendColors').classed("selected", false);
                    d3.select("#Color-"+i).classed('selected', true)
                    switch (d) {
                        case "adultes":
                            sources = sources.sort((a, b) => { return (a.adultes / a.total) - (b.adultes / b.total); });
                            break;
                        case "jeunes":
                            sources = sources.sort((a, b) => { return (a.jeunes / a.total) - (b.jeunes / b.total); });
                            break;
                        case "aines":
                            sources = sources.sort((a, b) => { return (a.aines / a.total) - (b.aines / b.total); });
                            break;
                        case "org":
                            sources = sources.sort((a, b) => { return (a.org / a.total) - (b.org / b.total); });
                            break;
                        case "autres":
                            sources = sources.sort((a, b) => { return (a.autres / a.total) - (b.autres / b.total); });
                            break;
                    }
                    this.updateData(sources, i);
                }

            });

        legend.append("text")
            .attr("x", 70)
            .attr("y", (d, i) => 15*i + 9)
            .attr("class", "legendTexts")
            .text( (d) => {
                switch (d) {
                    case "adultes":
                        return "Adultes"
                    case "jeunes":
                        return "Jeunes"
                    case "aines":
                        return "Ainés"
                    case "org":
                        return "Organismes et Projets"
                    case "autres":
                        return "Autres"
                }
            });

    }
}

function createPublicLoanSources(data) {
    let sources = [];
    data["2018"].forEach(function (d) {
        let bibli = {};
        bibli.bibliotheque = d["BIBLIOTHÈQUE"];
        bibli.arrondissement = getArrondissement(d["BIBLIOTHÈQUE"]);
        bibli.annee = 2018;
        bibli.adultes = parseInt(d["Adultes"].replace(",", ""));
        bibli.jeunes = parseInt(d["Jeunes"].replace(",", ""));
        bibli.aines = parseInt(d["Aînés"].replace(",", ""));
        bibli.org = parseInt(d["OrganismesAdultes"].replace(",", "")) +
            parseInt(d["OrganismesJeunes"].replace(",", "")) +
            parseInt(d["Projets spéciaux"].replace(",", ""));
        bibli.autres = parseInt(d["Prêt à domicile"].replace(",", "")) +
            parseInt(d["Dépôt temporaire"].replace(",", "")) +
            parseInt(d["Autres"].replace(",", ""));
        bibli.total = d["TOTAL"].replace(",", "");

        sources.push(bibli);
    });
    return sources;
}