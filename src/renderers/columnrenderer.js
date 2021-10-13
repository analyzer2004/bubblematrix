import { SortOrder } from "../chartdata.js";
import PartRenderer from "./partrenderer.js";

export default class ColumnRenderer extends PartRenderer {
    constructor(mainRenderer) {
        super(mainRenderer);
        this.text = null;
        this._arrow = null;
        this.labels = null;
        this.axis = null;
    }

    render() {
        const c = this.chart;
        const g = d3.select(c.partitions.columns)
            .append("svg")
            .attr("width", c.scales.maxX + c.measures.rowWidth)
            .attr("height", c.measures.columnHeight)
            .append("g");

        this.labels = this._renderGroups(
            g,
            `translate(0,${c.measures.columnHeight})`,
            "start",
            g => {
                this.text = g.append("text")
                    .attr("y", 0)
                    .attr("dy", "0.25em")
                    .attr("transform", "rotate(-90)")
                    .attr("fill", this.colors.label)
                    .text(this._trim.bind(this))
                    .on("click", this._click.bind(this));

                this._arrow = g.append("path")
                    .attr("fill", "#999")
                    .attr("transform", "rotate(-90)");
            }
        );

        this.axis = this._renderGroups(
            this.matrix.og,
            undefined,
            "middle",
            g => {
                g.append("line")
                    .attr("y1", 0).attr("y2", c.scales.maxY)
                    .attr("stroke-width", 1).attr("stroke", "#8d99ae");
            }
        );
    }

    _renderGroups(g, transform, textAnchor, draw) {
        const
            c = this.chart,
            gg = g.append("g");
        if (transform) gg.attr("transform", transform);
        return gg.selectAll("g")
            .data(c.chartData.columns)
            .join("g")
            .attr("text-anchor", textAnchor)
            .attr("transform", (d, i) => `translate(${c.scales.x(i) + c.measures.bubbleRadius},0)`)
            .call(draw);
    }

    _trim(d) {
        return this.chart.measures.trim(d.name);
    }

    _click(e, d) {
        this._sort(d);
        this._arrow.attr("d", c => {
            if (d.order !== SortOrder.none && d.name === c.name) {
                const
                    b = this.chart.measures.getBBox(this._trim(c)),
                    h = b.height / 2 + 1, w = b.width, aw = 5;
                return d.order === SortOrder.descending
                    ? `M 0 ${h} L ${w} ${h} L ${w} ${h + aw} L 0 ${h}`
                    : `M 0 ${h} L 0 ${h + aw} L ${w} ${h} L 0 ${h}`;
            }
        })
    }

    _sort(d) {
        const
            that = this,
            data = this.chart.chartData,
            columns = data.columns,
            cIndex = columns.indexOf(d),
            sorted = data.rows.map(d => ({ row: d, column: d.cells[cIndex] }));

        data.resetColumns(d);
        if (d.order === SortOrder.none) d.order = SortOrder.ascending;
        else if (d.order === SortOrder.ascending) d.order = SortOrder.descending;
        else d.order = SortOrder.none;

        if (d.order === SortOrder.ascending) {
            sorted.sort((a, b) => a.column.value - b.column.value);
        }
        else if (d.order === SortOrder.descending) {
            sorted.sort((a, b) => b.column.value - a.column.value);
        }

        const unit = this.duration / data.rows.length;
        sortRows(this.rows.axis);
        sortRows(this.rows.labels);
        this.rows.relocateAnnotation();

        function sortRows(g) {
            g.transition()
                .duration((d, i) => i * unit)
                .attr("transform", d => {
                    let rIndex = 0;
                    for (let i = 0; i < sorted.length; i++) {
                        if (sorted[i].row === d) {
                            d.position = rIndex = i;
                            break;
                        }
                    }
                    return `translate(0,${that.chart.scales.y(rIndex)})`;
                });
        }
    }
}
