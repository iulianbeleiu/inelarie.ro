import Plugin from 'src/plugin-system/plugin.class';
import DomAccess from 'src/helper/dom-access.helper';

export default class ShapeFlyoutMenuPlugin extends Plugin {

    static options = {
        /**
         * selector for the desktop navigation
         */
        mainNavigation: '#mainNavigation',

        /**
         * selector for the desktop flyout menu bar
         */
        flyoutNavigationMenu: '.main-navigation-flyout:not(.last-navigation)',
    };

    init() {
        this._registerEventListeners();
        this._makeFlyoutMenuFullWidth();
    }

    /**
     * Register events to handle hide navigation item
     * when viewport change
     * @private
     */
    _registerEventListeners() {
        this.el.addEventListener('click', this._navigateLink.bind(this));
    }

    _makeFlyoutMenuFullWidth() {
        const mainNavigation = DomAccess.querySelector(document, this.options.mainNavigation);
        const left = mainNavigation.getBoundingClientRect().left;

        Array.from(document.querySelectorAll(this.options.flyoutNavigationMenu)).forEach(flyoutNavigationMenu => {
            if (flyoutNavigationMenu.classList.contains('is-level-1')) {
                flyoutNavigationMenu.style.marginLeft = `-${left}px`;
            }
            flyoutNavigationMenu.style.paddingLeft = `${left}px`;
        });
    }

    _navigateLink(event) {
        event.stopPropagation();
        event.preventDefault();

        if (event.type === 'click' || event.key === 'Enter') {
            let ref = event.target || event.srcElement;
            if (ref && ref.getAttribute('data-href')) {
                let href = ref.getAttribute('data-href');

                if (ref.getAttribute('target') === "_blank") {
                    window.open(href, '_blank');
                }
                else {
                    window.location.replace(href);
                }
            }
        }
    }
}
