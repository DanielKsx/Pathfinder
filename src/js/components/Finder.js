import { settings, select, classNames } from '../settings.js';

class Finder {
    constructor() {
        this.stage = 'draw';
        this.selected = new Set();

        this.startCell = null;
        this.endCell = null;

        this.deltas = settings.finder.deltas;

        this.getElements();
        this.init();
    }

    getElements(){
        this.dom = {};
        
        this.dom.container = document.querySelector(select.finder.container);
        this.dom.grid = document.querySelector(select.finder.grid);
        this.dom.status = document.querySelector(select.finder.status);
        this.dom.action = document.querySelector(select.finder.action);
    }

    init() {
        if (!this.dom.container || !this.dom.grid || !this.dom.status || !this.dom.action) return;

        this.setStageDraw();
        this.renderGrid();
        this.bindEvents();
    }

    setStageDraw() {
        this.stage = 'draw';
        this.dom.status.textContent = 'Draw routes';
        this.dom.action.textContent = 'Finish drawing';
    }

    renderGrid() {
        const rows = settings.finder.rows;
        const cols = settings.finder.cols;

        this.dom.grid.innerHTML = '';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++){
                const cell = document.createElement('div');
                cell.classList.add(classNames.finder.cell);
                cell.dataset.row = String(r);
                cell.dataset.col = String(c);
                this.dom.grid.appendChild(cell);
            }
        }
    }

    bindEvents() {
  const thisFinder = this;

  thisFinder.dom.grid.addEventListener('click', function(event) {
    const cell = event.target.closest(`.${classNames.finder.cell}`);
    if (!cell) return;

    const id = thisFinder.cellId(cell);

    if (thisFinder.stage === 'draw') {
      // uncheck
      if (thisFinder.selected.has(id)) {
        thisFinder.selected.delete(id);
        cell.classList.remove(classNames.finder.selected);
        return;
      }

      // first random field 
      if (thisFinder.selected.size === 0) {
        thisFinder.selected.add(id);
        cell.classList.add(classNames.finder.selected);
        return;
      }

      // next to each other 
      if (!thisFinder.hasSelectedNeighbor(id)) {
        alert('You can only select a cell next to an existing route.');
        return;
      }

      thisFinder.selected.add(id);
      cell.classList.add(classNames.finder.selected);
      return;
    }

    if (thisFinder.stage === 'pickStart') {
      if (!thisFinder.selected.has(id)) return;

      // click before = clear 
      if (thisFinder.startCell) {
        const prev = thisFinder.dom.grid.querySelector(`[data-row="${thisFinder.startCell.split(':')[0]}"][data-col="${thisFinder.startCell.split(':')[1]}"]`);
        if (prev) prev.classList.remove(classNames.finder.start);
      }

      thisFinder.startCell = id;
      cell.classList.add(classNames.finder.start);

      thisFinder.stage = 'pickEnd';
      thisFinder.dom.status.textContent = 'Pick finish';
      return;
    }


    if (thisFinder.stage === 'pickEnd') {
      if (!thisFinder.selected.has(id)) return;
      if (id === thisFinder.startCell) return;

      if (thisFinder.endCell) {
        const prev = thisFinder.dom.grid.querySelector(`[data-row="${thisFinder.endCell.split(':')[0]}"][data-col="${thisFinder.endCell.split(':')[1]}"]`);
        if (prev) prev.classList.remove(classNames.finder.end);
      }

      thisFinder.endCell = id;
      cell.classList.add(classNames.finder.end);

      thisFinder.stage = 'ready';
      thisFinder.dom.status.textContent = 'Ready to compute';
      thisFinder.dom.action.textContent = 'Compute';
      return;
    }

  });

  // button
  thisFinder.dom.action.addEventListener('click', function(event) {
    event.preventDefault();

    if (thisFinder.stage === 'draw') {
      if (thisFinder.selected.size < 2) {
        alert('Draw at least 2 cells before finishing.');
        return;
      }

      thisFinder.stage = 'pickStart';
      thisFinder.dom.status.textContent = 'Pick start';
      return;
    }

    if (thisFinder.stage === 'ready') {
      thisFinder.computePath();

      thisFinder.stage = 'result';
      thisFinder.dom.status.textContent = 'The best route is';
      thisFinder.dom.action.textContent = 'Start again';
      return;
    }

    if (thisFinder.stage === 'result') {
      thisFinder.reset();
      return;
    }
  });
}

    cellId(cell) {
        return `${cell.dataset.row}:${cell.dataset.col}`;
    }

    hasSelectedNeighbor(id) {
        const [r, c] = id.split(':').map(Number);

        for (const [dr, dc] of this.deltas) {
            const neighborId = `${r + dr}:${c + dc}`;
            if (this.selected.has(neighborId)) return true;
  }

        return false;
}

    computePath() {
        const queue = [];
        const cameFrom = new Map();

        queue.push(this.startCell);
        cameFrom.set(this.startCell, null);

        while (queue.length > 0) {
        const current = queue.shift();

        if (current === this.endCell) break;

        const [r, c] = current.split(':').map(Number);

        for (const [dr, dc] of this.deltas) {
            const next = `${r + dr}:${c + dc}`;

            if (!this.selected.has(next)) continue;
            if (cameFrom.has(next)) continue;

            cameFrom.set(next, current);
            queue.push(next);
        }
    }

        if (!cameFrom.has(this.endCell)) {
            alert('No route found');
            return;
    }

        this.drawPath(cameFrom);
    }

    drawPath(cameFrom) {
        let current = this.endCell;

        while (current && current !== this.startCell) {
            this.markPathCell(current);
            current = cameFrom.get(current);
        }
    }

    markPathCell(id) {
        const [r, c] = id.split(':');

        const cell = this.dom.grid.querySelector(`[data-row="${r}"][data-col="${c}"]`);

        if (cell) {
            cell.classList.add(classNames.finder.path);
        }
    }

    reset() {
        this.selected.clear();
        this.startCell = null;
        this.endCell = null;

        this.setStageDraw();
        this.renderGrid();
    }
}

export default Finder;