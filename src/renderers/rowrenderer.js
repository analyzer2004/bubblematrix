import { InfoBox, Annotation } from "./infobox.js";
import { CellFlag, SortOrder } from "../chartdata.js";
import PartRenderer from "./partrenderer.js";

class RowRenderer extends PartRenderer {
    constructor(mainRenderer) {
        super(mainRenderer);
        this._tooltip = null;
        this._annotation = null;
        this.labels = null;
        this.axis = null;
        this.highlight = Highlight.matrix;
        this.showTooltip = true;
        this.showAnnotation = true;

        this._labelRects = null;
        this._bubbleRects = null;
        this._bubbles = null;
        this._focused = null;

        this.onhover = null;
        this.oncancel = null;
        this.onclick = null;
    }

    get bubbles() { return this._bubbles; }

    render() {
        this._initInfoLayer();

        const c = this.chart;
        const g = d3.select(c.partitions.rows)
            .append("svg")
            .attr("width", c.measures.rowWidth)
            .attr("height", c.scales.maxY)
            .append("g")
            .attr("transform", `translate(0,${c.measures.padding / 2})`);

        this.labels = this._renderGroups(g, g => {
            this._labelRects = this._renderRect(g, 1, c.measures.rowWidth + 10)
                .on("click", this._click.bind(this));

            g.append("text")
                .attr("font-weight", "bold")
                .attr("y", c.measures.bubbleRadius)
                .attr("dx", "1em")
                .attr("dy", "0.25em")
                .attr("fill", this.colors.label)
                .text(d => d.name)
                .on("click", this._click.bind(this));
        });

        const rectWidth = c.chartData.columns.length * c.measures.bubbleDiameter;
        this.axis = this._renderGroups(this.matrix.ig.append("g"), g => {
            this._bubbleRects = this._renderRect(g, -11, rectWidth + 10);
            this._bubbles = g.append("g")
                .selectAll("g")
                .data(d => d.cells)
                .join("g")
                .attr("transform", (d, i) => `translate(${c.scales.x(i) + c.measures.bubbleRadius},0)`)
                .call(g => {
                    g.append("circle")
                        .attr("class", "bubble")
                        .attr("fill", d => d.value >= c.chartData.average ? this.colors.above : this.colors.below)
                        .attr("stroke-width", 2)
                        .attr("cy", c.measures.bubbleRadius)
                        .attr("r", 0);
                })
                .on("click", this._handleClick.bind(this))
                .on("pointerenter", this._handlePointerEnter.bind(this))
                .on("pointermove", this._handlePointerMove.bind(this))
                .on("pointerleave", this._handlePointerLeave.bind(this));

            this._bubbles.selectAll("circle")
                .transition()
                .ease(d3.easeBounce)
                .duration(500)
                .attr("r", d => d.value ? c.scales.r(d.value) : 0);
        });

        this.highlightBubbles();
    }

    relocateAnnotation(delay = true) {
        if (this._focused) {
            const f = () => this._showAnnotation(null, this._focused);
            this._annotation.hide();
            if (delay) {
                setTimeout(f, this.duration);
            }
            else {
                f();
            }

        }
    }

    _handleClick(e, d) {
        if (this._focused !== d) {
            this._showAnnotation(e, d);
        }
        else {
            this._annotation.hide();
            this._focused = null;
        }
        if (this.onclick) this.onclick(e, d);
    }

    _showAnnotation(e, d) {
        const
            c = this.chart,
            a = this._annotation,
            getPosition = (axis, name) => {
                const obj = axis.find(d => d.name === name);
                return obj ? obj.position : 0;
            }

        if (this.showAnnotation) {
            const
                cx = c.scales.x(getPosition(c.chartData.columns, d.column)),
                cy = c.scales.y(getPosition(c.chartData.rows, d.row)),
                r = c.scales.r(d.value),
                color = d.value >= c.chartData.level ? this.colors.above : this.colors.below;

            this._focused = d;
            a.hide();
            a.show(
                null, this._getTooltipContent(d),
                cx + c.measures.bubbleRadius,
                cy + c.measures.bubbleRadius + c.measures.padding / 2,
                r, d3.color(color).darker(1));
        }
    }

    _handlePointerEnter(e, d) {
        const c = this.chart;

        if (this.showTooltip) this._tooltip.show(e, this._getTooltipContent(d));
        if (this.onhover) this.onhover(e, d);
        this.columns.axis.select("line").attr("stroke-width", col => col.name === d.column ? 2 : 1);
        this.columns.text.attr("font-weight", col => col.name === d.column ? "bold" : "");
        this._bubbles.filter(b => b === d)
            .call(g => {
                g.select(".bubble").attr("transform", "translate(1,-1.5)");
                g.insert("circle", "circle")
                    .attr("class", "shadow")
                    .attr("cy", c.measures.bubbleRadius)
                    .attr("r", d => d.value ? c.scales.r(d.value) : 0)
                    .attr("fill", d => {
                        const color = d.value >= c.chartData.level ? this.colors.above : this.colors.below;
                        return d3.color(color).darker(1);
                    })
            });
    }

    _handlePointerMove(e) {
        if (this.showTooltip) this._tooltip.move(e);
    }

    _handlePointerLeave(e, d) {
        if (this.showTooltip) this._tooltip.hide();
        if (this.oncancel) this.oncancel(e, d);
        this.columns.axis.select("line").attr("stroke-width", 1);
        this.columns.text.attr("font-weight", "");
        this._bubbles.filter(b => b === d)
            .call(g => {
                g.select(".bubble").attr("transform", "");
                g.select(".shadow").remove();
            });
    }

    highlightBubbles(update) {
        const bubbleRadius = this.chart.measures.bubbleRadius;
        const
            testByRow = d => this.highlight === Highlight.byRow && ((d.flag & CellFlag.rowMin) === CellFlag.rowMin || (d.flag & CellFlag.rowMax) === CellFlag.rowMax),
            testByMatrix = d => this.highlight === Highlight.matrix && ((d.flag & CellFlag.min) === CellFlag.min || (d.flag & CellFlag.max) === CellFlag.max),
            testByTop = d => this.highlight === Highlight.top && ((d.flag & CellFlag.topGroup) === CellFlag.topGroup),
            testByBottom = d => this.highlight === Highlight.bottom && ((d.flag & CellFlag.bottomGroup) === CellFlag.bottomGroup);

        const targets = this._bubbles.filter(d => d.value && (testByRow(d) || testByMatrix(d) || testByTop(d) || testByBottom(d)));
        targets.select("circle")
            .attr("stroke", d => {
                const color = d.value >= this.chart.chartData.level ? this.colors.above : this.colors.below;
                return d3.color(color).darker(0.75);
            });

        if (!update) {
            targets.append("text")
                .attr("text-anchor", "middle")
                .attr("y", d => {
                    const
                        r = this.chart.scales.r(d.value),
                        tl = this.chart.measures.calculateStringWidth(this._formatValue(d.value));
                    return tl + 5 > r * 2 ? bubbleRadius + r + 12 : bubbleRadius;
                })
                .attr("dy", "0.3em")
                .attr("fill", this.colors.label)
                .attr("font-weight", "bold")
                .text(d => this._formatValue(d.value));
        }
    }

    _formatValue(v, short = true) {
        const fmtStr = this.chart.chartData.numberIsPercentage ? ".1%" : short ? ".2s" : ",.2f";
        return d3.format(fmtStr)(v);
    }

    _initInfoLayer() {
        const
            that = this,
            currFont = this.chart.measures.font;

        if (this.showAnnotation) {
            const font = currFont.clone().family("Sans-serif").size("11px").weight("bold");
            this._annotation = new Annotation(this.matrix.svg, font, "none");
            assignDelegates(this._annotation, font);
        }

        if (this.showTooltip) {
            this._tooltip = new InfoBox(this.matrix.svg, currFont, "white", 0.7, "#aaa");
            assignDelegates(this._tooltip, currFont);
        }

        function assignDelegates(obj, font) {
            obj.getBBox = s => that.chart.measures.getBBox(s, undefined, font);
            obj.calcTextWidth = s => that.chart.measures.calculateStringWidth(s, undefined, font);
            obj.calcPosition = (c, b) => that._calcTooltipPosition(c, b);
        }
    }

    _getTooltipContent(d) {
        const names = this.chart.fieldNames;
        return [
            `${names.row}: ${d.row}`,
            `${names.column}: ${d.column}`,
            `${names.value}: ${this._formatValue(d.value, false)}`
        ];
    }

    _calcTooltipPosition(c, box) {
        const
            mBox = this.matrix.svg.node().getBoundingClientRect(),
            x = c.x + mBox.left,
            y = c.y + mBox.top;

        const
            t = 5,
            left = x + box.width + t > mBox.right ? c.x - box.width - t : c.x + t,
            top = y + box.height + t > mBox.bottom ? c.y - box.height - t : c.y + t;
        return { left, top };
    }

    _renderGroups(g, draw) {
        const c = this.chart;
        return g.selectAll("g")
            .data(c.chartData.rows)
            .join("g")
            .attr("transform", (d, i) => `translate(0,${c.scales.y(i)})`)
            .call(draw)
            .on("pointerenter", (e, d) => {
                this._bubbleRects.attr("stroke-width", row => row.name === d.name ? 2 : 0);
                this._labelRects.attr("stroke-width", row => row.name === d.name ? 2 : 0);
            })
            .on("pointerleave", (e, d) => {
                this._bubbleRects.attr("stroke-width", 0);
                this._labelRects.attr("stroke-width", 0);
            });
    }

    _renderRect(g, x, width) {
        const c = this.chart;
        return g.append("rect")
            .attr("width", width)
            .attr("height", c.measures.bubbleDiameter)
            .attr("x", x)
            .attr("rx", 10)
            .attr("opacity", 0.5)
            .attr("fill", this.colors.row)
            .attr("stroke", d3.color(this.colors.row).darker(1))
            .attr("stroke-width", 0);
    }

    _click(e, d) {
        this._sort(d);
        this._labelRects.attr("fill", d => d.order === SortOrder.ascending ? "white" : this.colors.row);
        this._bubbleRects.attr(
            "fill",
            _ => {
                if (_.order === SortOrder.none) {
                    return this.colors.row;
                }
                else {
                    const gradId = this.uid(_.order === SortOrder.ascending ? "ascending" : "descending");
                    return _ === d ? this.url(gradId) : this.colors.row;
                }
            }
        )
    }

    _sort(d) {
        const
            that = this,
            indices = [],
            data = this.chart.chartData,
            sorted = d.cells.map(v => v);

        data.resetRows(d);
        if (d.order === SortOrder.none) d.order = SortOrder.ascending;
        else if (d.order === SortOrder.ascending) d.order = SortOrder.descending;
        else d.order = SortOrder.none;

        if (d.order === SortOrder.ascending) {
            sorted.sort((a, b) => a.value - b.value);
        }
        else if (d.order === SortOrder.descending) {
            sorted.sort((a, b) => b.value - a.value);
        }

        const
            unit = this.duration / data.columns.length,
            x = this.chart.scales.x,
            bubbleRadius = this.chart.measures.bubbleRadius;
        sortColumn(this.columns.axis);
        sortColumn(this.columns.labels);
        this.relocateAnnotation();


        this._bubbles.transition()
            .duration((d, i) => i * unit)
            .attr("transform", (b, i) => `translate(${x(indices[i]) + bubbleRadius},0)`);

        function sortColumn(g) {
            g.transition()
                .duration((d, i) => i * unit)
                .attr("transform", c => {
                    let cIndex = 0;
                    for (let i = 0; i < sorted.length; i++) {
                        if (sorted[i].column === c.name) {
                            c.position = cIndex = i;
                            indices.push(i);
                            break;
                        }
                    }
                    return `translate(${x(cIndex) + bubbleRadius},0)`;
                });
        }
    }
}

class Highlight {
    static get matrix() { return 0; }
    static get byRow() { return 1; }
    static get top() { return 2; }
    static get bottom() { return 3; }
}

export { RowRenderer, Highlight };