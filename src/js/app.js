import { settings, select, classNames } from './settings.js';
import Finder from './components/Finder.js';
import { initAOS, refreshAOS } from './components/aos.js';

const app = {
  initPages: function() {
    const thisApp = this;

    thisApp.pages = document.querySelectorAll(select.all.pages);
    thisApp.navLinks = document.querySelectorAll(select.nav.links);

    const idFromHash = window.location.hash.replace('#', '');
    const startPageId = idFromHash || settings.app.defaultView;

    thisApp.activatePage(startPageId);

    for (const link of thisApp.navLinks) {
      link.addEventListener('click', function (event){
        event.preventDefault();
        const pageId = this.getAttribute('href').replace('#', '');
        window.location.hash = pageId;
      });
    }

    window.addEventListener('hashchange', function (){
      const idFromHash = window.location.hash.replace('#', '') || settings.app.defaultView;
      thisApp.activatePage(idFromHash);
    });
  },

  activatePage: function(pageId){
    const thisApp = this;

    let pageExists = false;
      for (const page of thisApp.pages){
        if (page.id === pageId){
          pageExists = true;
          break;
        }
      }

    const finalPageId = pageExists ? pageId : settings.app.defaultView;

      for (const page of thisApp.pages){
        page.classList.toggle(
          classNames.pages.active,
          page.id === finalPageId
        );
        page.classList.toggle(
          classNames.pages.hidden,
          page.id !== finalPageId
        );
      }

      for (const link of thisApp.navLinks){
        link.classList.toggle(
          classNames.nav.active,
          link.getAttribute('href') === '#' + finalPageId
        );
      }

      refreshAOS();
    },

  init: function(){
    const thisApp = this;

    initAOS();
    thisApp.initPages();
    thisApp.finder = new Finder();
    }
};





document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
