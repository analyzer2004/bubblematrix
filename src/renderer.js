import { CellFlag, SortOrder } from "./chartdata.js";
import { InfoBox, Annotation } from "./infobox.js";
import { Font } from "./measures.js";

class Renderer {
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

class PartRenderer {
    constructor(mainRenderer) {
        this._mainRenderer = mainRenderer;
        this.duration = 500;
    }

    get chart() { return this._mainRenderer.chart; }
    get matrix() { return this._mainRenderer.matrix; }
    get colors() { return this._mainRenderer.colors; }
    get rows() { return this._mainRenderer.rows; }
    get columns() { return this._mainRenderer.columns; }

    uid(id) {
        return this._mainRenderer.uid(id);
    }

    url(id) {
        return `url(#${id})`;
    }
}

class ColumnRenderer extends PartRenderer {
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

export { Renderer, Highlight };