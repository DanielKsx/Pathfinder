import { settings, select, classNames } from '../settings.js';

class Finder {
  constructor(element) {
    this.dom = {};
    this.templates = {};
    this.dom.container = element;

    this.stage = 'draw';
    this.selected = new Set();

    this.startCell = null;
    this.endCell = null;

    this.deltas = settings.finder.deltas;

    this.getElements();
    this.init();
  }

  getElements(){
    this.dom.grid = this.dom.container.querySelector(select.finder.grid);
    this.dom.action = this.dom.container.querySelector(select.finder.action);
    this.dom.statusContainer = this.dom.container.querySelector('#finder-header');

    this.dom.summary = document.querySelector(select.summary.overlay);
    this.dom.summaryBody = document.querySelector(select.summary.body);
    this.dom.summaryClose = document.querySelector(select.summary.close);

    const statusTpl = document.querySelector('#template-finder-status');
    this.templates.status = statusTpl
    ? Handlebars.compile(statusTpl.innerHTML)
    : null;

    const summaryTpl = document.querySelector(select.summary.template);
    this.templates.summary = summaryTpl
    ? Handlebars.compile(summaryTpl.innerHTML)
    : null;
  }

  init() {
    if (!this.dom.container || !this.dom.grid || !this.dom.statusContainer || !this.dom.action) return;

    this.setStageDraw();
    this.renderGrid();
    this.updateHints();
    this.bindEvents();
    this.bindSummary();
  }

  setStageDraw() {
    this.stage = 'draw';
    this.renderStatus('Draw routes');
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

  renderStatus(text) {
    if (!this.templates.status) return;
    this.dom.statusContainer.innerHTML = this.templates.status({ text });
  }

  showMessage(text) {
    this.renderStatus(text);

    const statusEl = this.dom.statusContainer.querySelector('.finder-status');
    if (statusEl) {
      statusEl.style.color = '#f72020ff';
    }

    setTimeout(() => {
      if (statusEl) statusEl.style.color = '';
      this.renderStatus('Draw routes');
      }, 1500);
    }


  clearHints() {
    const hinted = this.dom.grid.querySelectorAll('.' + classNames.finder.hint);
    for (const cell of hinted) {
      cell.classList.remove(classNames.finder.hint);
    }
  }

  addHintForId(id) {
    if (this.selected.has(id)) return;

    const [r, c] = id.split(':');

    const cell = this.dom.grid.querySelector('[data-row="' + r + '"][data-col="' + c + '"]');

    if (cell) {
      cell.classList.add(classNames.finder.hint);

    }
  }

  updateHints() {
    if (this.stage !== 'draw') {
      this.clearHints();
      return;
    }

    this.clearHints();
    if (this.selected.size === 0) return;

    const rows = settings.finder.rows;
    const cols = settings.finder.cols;

    for (const id of this.selected) {
      const [r, c] = id.split(':').map(Number);

      for (const [dr, dc] of this.deltas) {
        const nr = r + dr;
        const nc = c + dc;

        if (nr < 0 || nr >= rows) continue;
        if (nc < 0 || nc >= cols) continue;

        this.addHintForId(`${nr}:${nc}`);
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
          if (!thisFinder.canUnselect(id)) {
            thisFinder.showMessage('You cannot unselect this cell because it would break the route.');
            return;
          }

          thisFinder.selected.delete(id);
          cell.classList.remove(classNames.finder.selected);

          thisFinder.updateHints();
          return;
        }

        // first random field 
        if (thisFinder.selected.size === 0) {
          thisFinder.selected.add(id);
          cell.classList.add(classNames.finder.selected);

          thisFinder.updateHints();
          return;
        }

        // next to each other 
        if (!thisFinder.hasSelectedNeighbor(id)) {
          thisFinder.showMessage('You can only select a cell next to an existing route.');
          return;
        }

        thisFinder.selected.add(id);
        cell.classList.add(classNames.finder.selected);
        thisFinder.updateHints();
        return;
      }

      if (thisFinder.stage === 'pickStart') {
        if (!thisFinder.selected.has(id)) return;

        // click before = clear 
        if (thisFinder.startCell) {
          const prev = thisFinder.getCellById(thisFinder.startCell);
          if (prev) prev.classList.remove(classNames.finder.start);
        }

        thisFinder.startCell = id;
        cell.classList.add(classNames.finder.start);

        thisFinder.stage = 'pickEnd';
        thisFinder.renderStatus('Pick finish');
        return;
      }


      if (thisFinder.stage === 'pickEnd') {
        if (!thisFinder.selected.has(id)) return;
        if (id === thisFinder.startCell) return;

        if (thisFinder.endCell) {
          const prev = thisFinder.getCellById(thisFinder.endCell);
          if (prev) prev.classList.remove(classNames.finder.end);
        }

        thisFinder.endCell = id;
        cell.classList.add(classNames.finder.end);

        thisFinder.stage = 'ready';
        thisFinder.renderStatus('Ready to compute');
        thisFinder.dom.action.textContent = 'Compute';
        return;
      }

    });

    // button
    thisFinder.dom.action.addEventListener('click', function(event) {
      event.preventDefault();

      if (thisFinder.stage === 'draw') {
        if (thisFinder.selected.size < 2) {
          thisFinder.showMessage('Draw at least 2 cells before finishing.');
          return;
        }

        thisFinder.stage = 'pickStart';
        thisFinder.renderStatus('Pick start');
        thisFinder.updateHints();
        return;
      }

      if (thisFinder.stage === 'ready') {
        const shortest = thisFinder.computePath();
        if (shortest === null) return;

        const all = thisFinder.selected.size;
        const longest = thisFinder.getMaxOptionLength();

        thisFinder.stage = 'result';
        thisFinder.renderStatus('The best route is');
        thisFinder.dom.action.textContent = 'Start again';

        thisFinder.showSummary({ all, min: shortest, max: longest }); 
        return;
      }

      if (thisFinder.stage === 'result') {
        if (thisFinder.dom.summary) {
          thisFinder.dom.summary.classList.add('is-hidden');
        }
        thisFinder.reset();
        return;
      }
    });
  }

  cellId(cell) {
    return `${cell.dataset.row}:${cell.dataset.col}`;
  }

  getCellById(id) {
    if (!id) return null;
    const [r, c] = id.split(':');
    return this.dom.grid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
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
      this.showMessage('No route found');
      return null;
    }

    this.drawPath(cameFrom);

    let length = 1;
    let cur = this.endCell;
    while (cur && cur !== this.startCell) {
      cur = cameFrom.get(cur);
      length++;
    }

    return length;
  }

  drawPath(cameFrom) {
    let current = this.endCell;

    while (current && current !== this.startCell) {
      this.markPathCell(current);
      current = cameFrom.get(current);
    }
  }

  markPathCell(id) {
    const cell = this.getCellById(id);
    if (cell) cell.classList.add(classNames.finder.path);
  }

  canUnselect(id) {
    if (this.selected.size <= 2) return true;

    const remaining = new Set(this.selected);
    remaining.delete(id);

    const start = remaining.values().next().value;
    if (!start) return true;

    const visited = new Set();
    const queue = [start];
    visited.add(start);

    while (queue.length) {
      const current = queue.shift();
      const [r, c] = current.split(':').map(Number);

      for (const [dr, dc] of this.deltas) {
        const next = `${r + dr}:${c + dc}`;
        if (!remaining.has(next)) continue;
        if (visited.has(next)) continue;
        visited.add(next);
        queue.push(next);
      }
    }

    return visited.size === remaining.size;
  }

  getMaxOptionLength() {
    if (this.selected.size === 0) return 0;
    if (this.selected.size === 1) return 1;

    const any = this.selected.values().next().value;

    const first = this.bfsDistances(any);
    let farNode = any;
    let farDist = -1;

    for (const [id, d] of first.entries()) {
      if (d > farDist) {
        farDist = d;
        farNode = id;
      }
    }

    const second = this.bfsDistances(farNode);
    let best = 0;
    for (const d of second.values()) {
      if (d > best) best = d;
    }

    return best + 1;
  }

  bfsDistances(startId) {
    const dist = new Map();
    const queue = [startId];
    dist.set(startId, 0);

    while (queue.length) {
      const current = queue.shift();
      const [r, c] = current.split(':').map(Number);

      for (const [dr, dc] of this.deltas) {
        const next = `${r + dr}:${c + dc}`;
        if (!this.selected.has(next)) continue;
        if (dist.has(next)) continue;

        dist.set(next, dist.get(current) + 1);
        queue.push(next);
      }
    }

  return dist;
}

  bindSummary() {
    if (!this.dom.summary || !this.dom.summaryClose) return;

    this.dom.summaryClose.addEventListener('click', () => {
      this.dom.summary.classList.add('is-hidden');
    });
  }

  showSummary(data) {
    if (!this.dom.summary || !this.dom.summaryBody || !this.templates.summary) return;

    this.dom.summaryBody.innerHTML = this.templates.summary(data);
    this.dom.summary.classList.remove('is-hidden');
  }

  reset() {
    this.selected.clear();
    this.startCell = null;
    this.endCell = null;

    this.setStageDraw();
    this.renderGrid();
    this.updateHints();
  }
}

export default Finder; 