// https://github.com/analyzer2004/bubblematrix
// Copyright 2021 Eric Lo 

import Partitions from "./partitions.js";
import { ChartData, FieldNames } from "./chartdata.js";
import { Measures } from "./measures.js";
import Scales from "./scales.js";
import Renderer from "./renderers/renderer.js";
import { Highlight } from "./renderers/rowrenderer.js";
import Slider from "./slider.js";

export default class BubbleMatrix {
    constructor(container) {
        this._container = container;

        this._options = new BubbleMatrixOptions()
        this.partitions = new Partitions(this);

        this._dataset = null;
        this._fieldNames = new FieldNames();
        this.chartData = null;

        this.measures = new Measures(this._getMeasureSvg());
        this.scales = new Scales();

        this.renderer = new Renderer(this);
    }

    get fieldNames() { return this._fieldNames; }

    size(_) {
        if (arguments.length) {
            this.measures.width = _[0];
            this.measures.height = _[1];
            return this;
        }
        else {
            return [this.measures.width, this.measures.height];
        }
    }

    colors(_) {
        if (arguments.length) {
            this.renderer.colors.row = _.row;
            this.renderer.colors.above = _.above;
            this.renderer.colors.below = _.below;
            this.renderer.colors.label = _.label;
            return this;
        }
        else {
            return this.renderer.colors;
        }
    }

    margin(_) {
        if (arguments.length) {
            this.measures.margin.left = _.left;
            this.measures.margin.right = _.right;
            this.measures.margin.top = _.top;
            this.measures.margin.bottom = _.bottom;
            return this;
        }
        else {
            return this.measures.margin;
        }
    }

    options(_) {
        return arguments.length ? (this._options = Object.assign(this._options, _), this) : this._options;
    }

    columns(_) {
        if (arguments.length) {
            this._fieldNames.column = _.column;
            this._fieldNames.row = _.row;
            this._fieldNames.value = _.value;
            return this;
        }
        else {
            return this._fieldNames;
        }
    }

    font(_) {
        if (arguments.length) {
            this.measures.font.family(_.family);
            this.measures.font.size(_.size);
            return this;
        }
        else {
            return this.measures.font;
        }
    }

    data(_) {
        return arguments.length ? (this._dataset = _, this) : this._dataset;
    }

    events(_) {
        if (arguments.length) {
            this.renderer.rows.onclick = _.onclick;
            this.renderer.rows.onhover = _.onhover;
            this.renderer.rows.oncancel = _.oncancel;
            return this;
        }
        else {
            return {
                onclick: this.renderer.onclick,
                onhover: this.renderer.onhover,
                oncancel: this.renderer.oncancel
            }
        }
    }

    render() {
        const options = this._options;

        this.chartData = new ChartData(this._dataset, this._fieldNames);
        this.chartData.numberIsPercentage = options.numberIsPercentage;
        this.chartData.preserveColumnOrder = options.preserveColumnOrder;
        this.chartData.preserveRowOrder = options.preserveRowOrder;
        this.chartData.numOfTopBottom = options.numberOfTopBottom;
        this.chartData.process();

        this.measures.initialize(this.chartData, options.showSlider);
        this.scales.initialize(this);

        this.partitions.initialize();
        this._container.appendChild(this.partitions.chartArea);

        this.renderer.rows.highlight = Highlight[options.highlightScope];
        this.renderer.rows.showTooltip = options.showTooltip;
        this.renderer.rows.showAnnotation = options.showAnnotation;
        this.renderer.render();

        if (options.showSlider) {
            const slider = new Slider(this, options.sliderCaption);
            slider.render();
        }

        this.partitions.adjustScrollableBlocks();
        return this;
    }

    _getMeasureSvg() {
        const svg = d3.select(this._container)
            .append("svg")
            .attr("width", 0)
            .attr("height", 0)
            .style("position", "absolute")
            .style("visibility", "hidden");
        svg.append("text");
        return svg;
    }
}

class BubbleMatrixOptions {
    constructor() {
        this.numberIsPercentage = false;
        this.preserveRowOrder = false;
        this.preserveColumnOrder = false;
        this.showSlider = true;
        this.sliderCaption = "Value";
        this.highlightScope = "matrix"; // "matrix", "byRow", "topBottom"
        this.numberOfTopBottom = 5;
        this.showTooltip = true;
        this.showAnnotation = true;
    }
}