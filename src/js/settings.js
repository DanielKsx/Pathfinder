
export const settings = {
  app: {
    defaultView: 'about',
  },

  finder: {
    rows: 10,
    cols: 10,

    deltas: [
      [-1, 0],
      [1, 0],
      [0, -1], 
      [0, 1],
    ],
  },
};

export const select = {
  all: {
    pages: '.app-view',
  },
  nav: {
    links: '.main-nav a[href^="#"]',
  },
  finder: {
    container: '.finder',
    grid: '.finder-grid',
    action: '.finder-action',
  },
  summary: {
    overlay: '#route-summary',
    body: '#route-summary-body',
    close: '.overlay-close',
    template: '#template-route-summary',
  },
};

export const classNames = {
  pages: {
    active: 'is-active',
    hidden: 'is-hidden',  
  },
  nav: {
    active: 'is-active',
  },

  finder: {
    cell: 'finder-cell',
    selected: 'finder-cell--selected',
    start: 'finder-cell--start',
    end: 'finder-cell--end',
    path: 'finder-cell--path',
    hint: 'finder-cell--hint',
  },
};