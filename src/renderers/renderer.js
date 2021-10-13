import { RowRenderer } from "./rowrenderer.js";
import ColumnRenderer from "./columnrenderer.js";
export default class Renderer {
    constructor(chart) {
        this.chart = chart;

        this.colors = {
            row: "#caf0f8",
            above: "#ffd166",
            below: "#118ab2",
            label: "black"
        };

        this.matrix = {
            svg: null,
            g: null,
            og: null,
            ig: null
        };

        this.columns = new ColumnRenderer(this);
        this.rows = new RowRenderer(this);

        this._uuid = `uu${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }

    render() {
        this._initMatrix();
        this._renderGradients();
        this.columns.render();
        this.rows.render();
    }

    _createSvg(container, width, height) {
        return d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    }

    _transform(x, y) {
        return `translate(${x},${y})`;
    }

    _initMatrix() {
        const
            c = this.chart,
            m = this.matrix;
        m.svg = this._createSvg(c.partitions.matrix, c.scales.maxX, c.scales.maxY);
        m.g = m.svg.append("g");
        m.og = m.g.append("g");
        m.ig = m.svg.append("g").attr("transform", this._transform(0, c.measures.padding / 2));
    }

    uid(id) {
        return `${this._uuid}_${id}`;
    }

    _renderGradients() {
        const
            c = this.chart,
            addGradient = reversed => {
                this.matrix.g.append("linearGradient")
                    .attr("id", this.uid(reversed ? "descending" : "ascending"))
                    .attr("x1", 0)
                    .attr("x2", c.measures.rowWidth + c.chartData.columns.length * c.measures.bubbleDiameter)
                    .attr("y1", "100%")
                    .attr("y2", "100%")
                    .attr("gradientUnits", "userSpaceOnUse")
                    .call(g => {
                        g.append("stop").attr("stop-color", this.colors.row).attr("stop-opacity", reversed ? 1 : 0).attr("offset", 0);
                        g.append("stop").attr("stop-color", this.colors.row).attr("stop-opacity", reversed ? 0 : 1).attr("offset", 1);
                    });
            };

        addGradient(false);
        addGradient(true);
    }
}