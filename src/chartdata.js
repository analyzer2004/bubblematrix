class ChartData {
    constructor(dataset, fieldNames) {
        this._dataset = dataset;
        this._fieldNames = fieldNames;

        this.numberIsPercentage = false;
        this.preserveColumnOrder = false;
        this.preserveRowOrder = false;
        this.columns = null;
        this.rows = null

        this.level = 0;
        this.defaultLevel = 0;
        this.average = 0;
        this.min = 0;
        this.max = 0;
        this.numOfTopBottom = 5;
    }

    resetColumns(exception) {
        this.columns.forEach(c => {
            if (c !== exception) c.order = SortOrder.none;
        });
    }

    resetRows(exception) {
        this.rows.forEach(r => {
            if (r !== exception) r.order = SortOrder.none;
        });
    }

    process() {
        const names = this._fieldNames;
        const rows = d3.group(this._dataset, d => d[names.row]);
        this.columns = [...new Set(this._dataset.map(d => d[names.column]))]
            .map((d, i) => new Column(d, i));
        if (!this.preserveColumnOrder) {
            this.columns.sort((a, b) => a.name.localeCompare(b.name));
            this.columns.forEach((c, i) => c.position = i);
        }

        const keys = [...rows.keys()];
        if (!this.preserveRowOrder) keys.sort((a, b) => a.localeCompare(b));
        this.rows = keys.map((key, i) => {
            const srcRow = rows.get(key);
            const cells = this.columns.map(col => {
                const c = srcRow.find(d => d[names.column] === col.name);
                return new Cell(key, col.name, c ? +c[names.value] : null);
            });
            const row = new Row(key, i, cells);
            row.markBounds();
            return row;
        });

        const cells = this.rows
            .flatMap(r => r.cells)
            .filter(c => c.value)
            .sort((a, b) => a.value - b.value);
        cells[0].flag |= CellFlag.min;
        cells[cells.length - 1].flag |= CellFlag.max;
        cells.slice(0, this.numOfTopBottom).forEach(cell => cell.flag |= CellFlag.bottomGroup);
        cells.slice(-this.numOfTopBottom).forEach(cell => cell.flag |= CellFlag.topGroup);

        const total = cells.reduce((a, b) => a + b.value, 0);
        this.level = this.defaultLevel = this.average = total / cells.length;
        this.min = cells[0].value;
        this.max = cells[cells.length - 1].value;
    }
}

class Column {
    constructor(name, position) {
        this.name = name;
        this.position = position;
        this.order = SortOrder.none;
    }
}

class Row {
    constructor(name, position, cells) {
        this.name = name;
        this.position = position;
        this.order = SortOrder.none;
        this.cells = cells;
    }

    markBounds() {
        const sorted = [...this.cells].filter(c => c.value).sort((a, b) => a.value - b.value);
        sorted[0].flag |= CellFlag.rowMin;
        sorted[sorted.length - 1].flag |= CellFlag.rowMax;
    }
}

class Cell {
    constructor(row, column, value) {
        this.row = row;
        this.column = column;
        this.value = value;
        this.flag = CellFlag.unspecified;
    }
}

class FieldNames {
    constructor(column, row, value) {
        this.column = column;
        this.row = row;
        this.value = value;
    }
}

class SortOrder {
    static get none() { return 0; }
    static get ascending() { return 1; }
    static get descending() { return 2; }
}

class CellFlag {
    static get unspecified() { return 0; }
    static get min() { return 1; }
    static get max() { return 2; }
    static get rowMin() { return 4; }
    static get rowMax() { return 8; }
    static get bottomGroup() { return 16; }
    static get topGroup() { return 32; }
}

export { ChartData, FieldNames, CellFlag, SortOrder };