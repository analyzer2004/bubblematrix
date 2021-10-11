class Measures {
    constructor(svg) {
        this._svg = svg;
        this.font = new Font();

        this.padding = 10;
        this.margin = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };

        this.width = 0;
        this.height = 0;

        this.sliderHeight = 20;
        this.columnHeight = 0;
        this.rowWidth = 0;

        this._minRadius = 25;
        this.bubbleRadius = 0;
        this.bubbleDiameter = 0;
    }

    initialize(chartData, showSlider) {
        this._calculateLabels(chartData);
        this._calculateBubbleRadius(chartData, showSlider);
    }

    _calculateLabels(chartData) {
        const max = (strs, font) => {
            let max = 0;
            strs.forEach(str => {
                const w = this.calculateStringWidth(str, undefined, font);
                if (w > max) max = w;
            });
            return max;
        }

        this.columnHeight = max(chartData.columns.map(c => this.trim(c.name) + "M"));
        this.rowWidth = this.margin.left + max(chartData.rows.map(r => r.name + "MM"), this.font.clone().weight("bold"));
    }

    _calculateBubbleRadius(chartData, showSlider) {
        const
            aw = this.width - this.rowWidth,
            ah = this.height - this.columnHeight - this.padding * 2 - (showSlider ? this.sliderHeight : 0),
            rc = chartData.rows.length,
            cc = chartData.columns.length;

        const
            r1 = (ah / rc - this.padding) / 2,
            r2 = aw / cc / 2;

        if (r1 < r2) {
            this.bubbleRadius = r1;
        }
        else {
            const total = rc * r2;
            this.bubbleRadius = r2 > ah ? r2 - (total - ah) / rc / 2 : r2;
        }

        if (this.bubbleRadius < this._minRadius) this.bubbleRadius = this._minRadius;
        this.bubbleDiameter = this.bubbleRadius * 2;
    }

    getBBox(str, angle, font) {
        const f = font ?? this.font;
        const text = this._svg.select("text");
        if (text) {
            f.applyTo(text);
            text.text(str);
            if (angle) text.attr("transform", `rotate(${angle})`);
            return text.node().getBBox();
        }
        else {
            return null;
        }
    }

    calculateStringWidth(str, angle, font) {
        const b = this.getBBox(str, angle, font);
        return b
            ? Math.sqrt(b.width * b.width + b.height * b.height)
            : str.length * this.font.size;
    }

    trim(s) {
        return s.length > 10 ? `${s.substr(0, 10)}...` : s;
    }
}

class Font {
    constructor(family = "", size = "10pt", style = "normal", weight = "normal") {
        this._family = family;
        this._size = size;
        this._style = style;
        this._weight = weight;
    }

    family(_) { return arguments.length ? (this._family = _, this) : this._family; }
    size(_) { return arguments.length ? (this._size = _, this) : this._size; }
    style(_) { return arguments.length ? (this._style = _, this) : this._style; }
    weight(_) { return arguments.length ? (this._weight = _, this) : this._weight; }


    applyTo(elem) {
        elem = elem instanceof HTMLElement ? d3.select(elem) : elem;
        elem.style("font-family", this._family)
            .style("font-size", isNaN(+this._size) ? this._size : `${this._size}pt`)
            .style("font-style", this._style)
            .style("font-weight", this._weight);
    }

    clone() {
        return new Font(this._family, this._size, this._style, this._weight);
    }
}

export { Measures, Font };