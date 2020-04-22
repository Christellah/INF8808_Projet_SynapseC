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
            .attr("width", "600")
            .attr("height", height + margin.top + margin.bottom)
            .append("g");
    }

    static years() {
        return [2013, 2014, 2015, 2016, 2017, 2018]
    }

    static domainYears(y, sources) {
        y.domain(StackedBar.years());
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

        console.log(sources);

        selection.data(sources)
                .enter().append("g")
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

        this.domainY(this.y, sources);
        let series = d3.stack()
            .keys(Object.keys(sources[0]).slice(3))
            .offset(d3.stackOffsetExpand)
            (sources)
            .map(d => (d.forEach(v => v.key = d.key), d));
        this.updateData(series);
    }

    updateData(sources) {
        this.svg.selectAll().call(this.createFunction, sources, this.x, this.y, this.colorScale);
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
function createPublicLoanSources(data) {
    let sources = [];

    for (const year in data) {
        if (year === '2018') {
            data[year].forEach(function (d) {
                let bibli = {};
                bibli.bibliotheque = d["BIBLIOTHÈQUE"];
                bibli.arrondissement = getArrondissement(d["BIBLIOTHÈQUE"]);
                bibli.annee = parseInt(year);
                bibli.adultes = parseInt(d["Adultes"].replace(",", ""));
                bibli.jeunes = parseInt(d["Jeunes"].replace(",", ""));
                bibli.aines = parseInt(d["Aînés"].replace(",", ""));
                bibli.org = parseInt(d["OrganismesAdultes"].replace(",", "")) +
                    parseInt(d["OrganismesJeunes"].replace(",", "")) +
                    parseInt(d["Projets spéciaux"].replace(",", ""));
                bibli.autres = parseInt(d["Prêt à domicile"].replace(",", "")) +
                    parseInt(d["Dépôt temporaire"].replace(",", "")) +
                    parseInt(d["Autres"].replace(",", ""));

                sources.push(bibli);
            });
        }
    }

    // console.log(sources);
    return sources;
}