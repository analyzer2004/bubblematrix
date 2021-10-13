export default class PartRenderer {
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
