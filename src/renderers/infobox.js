class InfoBox {
    constructor(svg, font, fill, opacity, stroke) {
        this._svg = svg;
        this._font = font;
        this._charBox = null;
        this._box = this._initBox(fill, opacity, stroke);
        this.left = 0;
        this.top = 0;

        this.getBBox = null;
        this.calcTextWidth = null;
        this.calcPosition = null;
    }

    get box() { return this._box; }
    get offset() { return 10; }

    show(e, content, x, y) {
        if (!this._charBox) this._charBox = this.getBBox("M");

        const
            that = this,
            space = 1.4,
            width = this._calcWidth(content);

        this._box
            .style("visibility", "visible")
            .select("rect")
            .attr("width", width + 10)            
            .attr("height", `${content.length * space + 0.5}em`);

        drawTexts("backtext", "white", 3);
        drawTexts("foretext");

        this.move(e, x, y);

        function drawTexts(className, stroke, strokeWidth) {
            that._box
                .selectAll("." + className)
                .data(content)
                .join(
                    enter => {
                        enter.append("text")
                            .attr("class", className)
                            .attr("dy", (d, i) => `${space * i + 1}em`)                            
                            .attr("stroke", stroke)
                            .attr("stroke-width", strokeWidth)
                            .text(d => d);
                    },
                    update => update.text(d => d),
                    exit => exit.remove()
                );
        }
    }

    move(e, x, y) {
        if (this._box) {
            const
                converted = x && y ? new DOMPoint(x, y) : this._convertCoordinate(e, this._svg),
                box = this._box.node().getBBox();
            const { left, top } = this.calcPosition(converted, box);
            this.left = left + this.offset;
            this.top = top + this.offset;
            this._box.attr("transform", `translate(${this.left},${this.top})`);
        }
    }

    hide() {
        if (this._box) this._box.style("visibility", "hidden");
    }

    _initBox(fill, opacity, stroke) {
        const box = this._svg
            .append("g")
            .attr("fill", "black")
            .call(g => {
                g.append("rect")
                    .attr("opacity", opacity)
                    .attr("stroke", stroke)
                    .attr("stroke-width", 0.5)
                    .attr("rx", 4).attr("ry", 4)
                    .attr("x", -5).attr("y", -5)
                    .attr("fill", fill);
            });
        this._font.applyTo(box);
        return box;
    }

    _calcWidth(strs) {
        let max = 0;
        strs.forEach(s => {
            const len = this.calcTextWidth(s);
            if (len > max) max = len;
        });
        return max;
    }

    _convertCoordinate(e, g) {
        const p = this._svg.node().createSVGPoint()
        p.x = e.clientX;
        p.y = e.clientY;
        return p.matrixTransform(g.node().getScreenCTM().inverse());
    }
}

class Annotation extends InfoBox {
    constructor(svg, font, fill, opacity, stroke) {
        super(svg, font, fill, opacity, stroke);
        this._pointer = null;
    }

    show(e, content, x, y, r, color) {
        super.show(e, content, x, y);
        const b = this.box.node().getBBox();

        this.move(e, x + r - this.offset, y + r - this.offset);

        const shift = this.offset / 2;
        let
            left = this.left, top = this.top,
            tx = left - shift, ty = top - shift,
            sx = tx + 30, sy = ty + b.height;
        if (left < x) {
            tx = x - r - shift;
            sx = tx - 30;
            left = x - r - b.width;
        }
        if (top < y) {
            ty = y - r - shift;
            sy = ty - b.height;
            top = y - r - b.height;
        }
        this.box.attr("transform", `translate(${left},${top})`);

        this._removePointer();
        this._pointer = this._svg.append("path")
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "2")
            .attr("d", `M ${x} ${y} L ${tx} ${ty} L ${tx} ${sy} L ${sx} ${sy}`);
    }

    hide() {
        super.hide();
        this._removePointer();
    }

    _removePointer() {
        if (this._pointer) {
            this._pointer.remove();
            this._pointer = null;
        }
    }
}

export { InfoBox, Annotation };