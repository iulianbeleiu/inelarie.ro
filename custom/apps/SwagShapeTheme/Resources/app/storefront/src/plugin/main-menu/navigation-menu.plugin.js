import Plugin from 'src/plugin-system/plugin.class';
import DomAccess from 'src/helper/dom-access.helper';

export default class NavigationMenu extends Plugin {

    static options = {
        /**
         * selector for the desktop navigation item
         */
        mainNavigationLink: '.main-navigation-link',

        /**
         * selector for the desktop flyout menu item in not last navigation menu
         */
        flyoutNavigationMenuItem: '.main-navigation-flyout:not(.last-navigation) .navigation-flyout-link',

        /**
         * selector for the desktop flyout menu item in not last navigation menu
         */
        header: '.header-row',
    };

    init() {
        this._registerEventListeners();
        this._hideNavigationMenuItem();
    }

    /**
     * Register events to handle hide navigation item
     * when viewport change
     * @private
     */
    _registerEventListeners() {
        document.addEventListener('Viewport/hasChanged', this._hideNavigationMenuItem.bind(this));
    }

    _hideNavigationMenuItem() {
        const searchPosition = this.el.getBoundingClientRect();

        Array.from(document.querySelectorAll(this.options.mainNavigationLink)).forEach(mainNavigationItem => {
            if (mainNavigationItem.getBoundingClientRect().left > searchPosition.left) {
                $(mainNavigationItem).addClass("d-none");
            } else {
                $(mainNavigationItem).removeClass("d-none");
            }
        });

        Array.from(document.querySelectorAll(this.options.flyoutNavigationMenuItem)).forEach(flyoutNavigationMenuItem => {
            if (flyoutNavigationMenuItem.getBoundingClientRect().right > searchPosition.right) {
                $(flyoutNavigationMenuItem).addClass("d-none");
            } else {
                $(flyoutNavigationMenuItem).removeClass("d-none");
            }
        });

        const header = DomAccess.querySelector(document, this.options.header);
        header.style.overflow = "visible";

    }
}
