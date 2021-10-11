export default class Partitions {
    constructor(chart) {
        this._chart = chart;

        this.chartArea = this._createDiv();
        this.mainBlock = this._createDiv();
        this.slider = this._createDiv();
        this.columnBlock = this._createDiv();
        this.placeHolder = this._createDiv();
        this.columns = this._createDiv();
        this.matrixBlock = this._createDiv();
        this.rows = this._createDiv();
        this.matrix = this._createDiv();
    }

    initialize() {
        this._initStyles();
        this._initLayout();
        this._adjustSize();
    }

    adjustScrollableBlocks() {
        const
            gh = this.matrix.offsetHeight - this.matrix.clientHeight,
            gw = this.matrix.offsetWidth - this.matrix.clientWidth;
        if (gh) this.rows.style.height = `${this.rows.clientHeight - gh}px`;
        if (gw) this.columns.style.width = `${this.columns.clientWidth - gw}px`;
    }

    changeFont(font) {
        this.chartArea.style.font = font.shorthand;
    }

    _adjustSize() {
        const measures = this._chart.measures;
        this.chartArea.style.height = `${measures.height}px`;
        if (this._chart.options().showSlider) this.slider.style.height = `${measures.sliderHeight}px`;
        this.columns.style.height = `${measures.columnHeight}px`;
        this.columns.style.width = `${measures.width - measures.rowWidth - measures.margin.left}px`;
        this.placeHolder.style.width = `${measures.rowWidth + measures.margin.left}px`;
        this.placeHolder.style.height = `${measures.columnHeight}px`;
        this.rows.style.width = `${measures.rowWidth + measures.margin.left}px`;
        this.matrix.style.width = `${measures.width + measures.margin.right + measures.rowWidth}px`;
    }

    _createDiv() {
        return document.createElement("div");
    }

    _initStyles() {
        const
            measures = this._chart.measures,
            width = measures.width + measures.margin.left + measures.margin.right;

        // chartArea
        let s = this.chartArea.style;
        s.display = "flex";
        s.flexDirection = "column";
        s.cursor = "default";
        s.userSelect = "none";
        measures.font.applyTo(this.chartArea);

        // mainBlock
        s = this.mainBlock.style;
        s.display = "flex";
        s.flexDirection = "column";
        s.flexGrow = 1;
        s.height = "1px";

        // columnBlock
        s = this.columnBlock.style;
        s.textAlign = "left";
        s.display = "flex";
        s.flexDirection = "row";
        s.flexShrink = 0;
        s.width = "1px";

        // placeHolder
        s = this.placeHolder.style;
        s.flexShrink = 0;
        s.backgroundColor = "white";

        // columns
        s = this.columns.style;
        s.paddingTop = "5px";
        s.paddingBottom = "5px";
        s.overflow = "hidden";
        s.flexShrink = 0;
        s.width = `${width}px`;

        // matrixBlock
        s = this.matrixBlock.style;
        s.display = "flex";
        s.flexDirection = "row";
        s.flexGrow = 0;
        s.width = "1px";
        s.overflowY = "auto";
        s.textAlign = "left";
        s.width = `${width}px`;

        // rows
        s = this.rows.style;
        s.overflow = "hidden";
        s.flexShrink = 0;

        // matrix
        s = this.matrix.style;
        s.overflowX = "auto";
        this.matrix.onscroll = ev => {
            this.columns.scrollLeft = this.matrix.scrollLeft;
            this.rows.scrollTop = this.matrix.scrollTop;
        }
    }

    _initLayout() {
        this.chartArea.appendChild(this.mainBlock);
        this.mainBlock.appendChild(this.slider);
        this.mainBlock.appendChild(this.columnBlock);
        this.mainBlock.appendChild(this.matrixBlock);
        this.columnBlock.appendChild(this.placeHolder);
        this.columnBlock.appendChild(this.columns);
        this.matrixBlock.appendChild(this.rows);
        this.matrixBlock.appendChild(this.matrix);
    }
}