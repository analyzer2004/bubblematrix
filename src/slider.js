export default class Slider {
    constructor(chart, caption) {
        this._chart = chart;
        this._caption = caption;

        this._g = null;
        this._label = null;
        this._below = null;
        this._above = null;

        this._width = 0;
        this._min = 0;
        this._max = 0;
        this._defaultValue = 0;
    }

    get level() { return this._chart.chartData.level; }
    set level(v) { this._chart.chartData.level = v; }
    get defaultLevel() { return this._chart.chartData.defaultLevel; }
    get isPercent() { return this._chart.chartData.numberIsPercentage; }
    get height() { return this._chart.measures.sliderHeight; }
    get rowRenderer() { return this._chart.renderer.rows; }

    render() {
        const measures = this._chart.measures;

        this._initialize();
        this._g = d3.select(this._chart.partitions.slider)
            .append("svg")
            .attr("width", measures.width)
            .attr("height", this.height)
            .append("g");

        this._renderLabel();
        this._renderColorRects();
        this._renderSlider();
    }

    _initialize() {
        const
            measures = this._chart.measures,
            chartData = this._chart.chartData;

        this._defaultValue = this.isPercent ? this.defaultLevel * 100 : this._roundUp(this.defaultLevel, 1),
            this._width = (measures.width - measures.rowWidth) / 2;

        let min = chartData.min, max = chartData.max;
        if (this.isPercent) {
            min = min * 100;
            max = max * 100 + 1;
            min = min > 0 ? min - 1 : min;
        }
        this._min = min;
        this._max = max;
    }

    _renderLabel() {
        this._label = this._g.append("text")
            .attr("x", this._width + 12)
            .attr("y", 10)
            .attr("dy", "0.5em")
            .attr("fill", "black");
        this._updateLabel(this._defaultValue);
    }

    _renderColorRects() {
        const { a, b } = this._getSafeBound();
        const x = (this._defaultValue - a) / (b - a) * this._width;

        this._below = this._g.append("rect")
            .attr("y", 2)
            .attr("rx", 5)
            .attr("width", x).attr("height", this.height - 2)
            .attr("opacity", 0.5)
            .attr("fill", this._chart.renderer.colors.below);

        this._above = this._g.append("rect")
            .attr("x", x).attr("y", 2)
            .attr("rx", 5)
            .attr("width", this._width - x)
            .attr("height", this.height - 2)
            .attr("opacity", 0.5)
            .attr("fill", this._chart.renderer.colors.above);
    }

    _renderSlider() {
        const { a, b } = this._getSafeBound();

        const fo = this._g.append("foreignObject")
            .attr("width", this._width + 2)
            .attr("height", this.height);

        this._slider = fo.append("xhtml:input")
            .attr("type", "range")
            .attr("min", a).attr("max", b)
            .style("width", `${this._width - 5}px`)
            .style("height", `${this._height}px`)
            .on("click", e => e.stopPropagation())
            .on("dblclick", e => {
                this._slider.node().value = this._defaultValue;
                this._change();
                e.stopPropagation();
            })
            .on("input", () => this._change());
        this._slider.node().value = this._defaultValue;
    }

    _change() {
        const { a, b } = this._getSafeBound();
        const
            v = +this._slider.node().value,
            vv = v < a ? a : v > b ? b : v,
            x = (vv - a) / (b - a) * this._width;

        this._below.attr("width", x);
        this._above.attr("x", x).attr("width", this._width - x);
        this._updateLabel(v);
        this.level = this.isPercent ? v / 100 : v;

        const colors = this._chart.renderer.colors;
        this.rowRenderer.bubbles
            .selectAll("circle")
            .transition()
            .duration(1000)
            .ease(d3.easeBounce)
            .attr("fill", d => d.value >= this.level ? colors.above : colors.below);
        this.rowRenderer.highlightBubbles(true);
        this.rowRenderer.relocateAnnotation(false);
    }

    _getSafeBound() {
        const
            a = this.isPercent ? this._min : this._roundDown(this._min, 2),
            b = this.isPercent ? this._max : this._roundUp(this._max, 2);
        return { a, b };
    }

    _roundUp(n, precision) {
        const
            f = n < 0 ? -1 : 1,
            s = Math.ceil(Math.abs(n)).toString(),
            d = Math.pow(10, s.length - precision);
        return Math.ceil(+s / d) * d * f;
    }

    _roundDown(n, precision) {
        const
            f = n < 0 ? -1 : 1,
            g = n < 0 ? 1 : 0,
            s = Math.floor(Math.abs(n)).toString(),
            d = Math.pow(10, s.length - precision);
        return (Math.floor(+s / d) + g) * d * f;
    }

    _updateLabel(value) {
        const v = value.toFixed(0);
        const vStr = this.isPercent ? `${v}%` : d3.format(",.2r")(v);
        this._label.text(`${this._caption} = ${vStr}`);
    }
}