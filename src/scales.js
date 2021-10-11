export default class Scales {
    constructor() {
        this.x = null;
        this.y = null;
        this.r = null;
        this._maxX = 0;
        this._maxY = 0;
    }

    get maxX() { return this._maxX; }
    get maxY() { return this._maxY; }

    initialize(chart) {
        const measures = chart.measures;
        const chartData = chart.chartData;

        this.x = i => i * measures.bubbleDiameter;
        this.y = i => i * (measures.bubbleDiameter + measures.padding);
        this.r = d3.scaleLinear()
            .domain([chartData.min, chartData.max])
            .range([measures.bubbleRadius * 0.2, measures.bubbleRadius - 1.5]);
        this._maxX = this.x(chartData.columns.length);
        this._maxY = this.y(chartData.rows.length);
    }
}