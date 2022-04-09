import Plugin from 'src/plugin-system/plugin.class';

const HOVER_CLASS = 'hover'

export default class ShapeProductBoxPlugin extends Plugin {

    static options = {
        /**
         * selector for the product box
         */
        productBoxSelector: '.product-box'
    };

    init() {
        this._registerEventListeners();
    }

    /**
     * Register events to show Action bar
     * when touch in product box
     * @private
     */
    _registerEventListeners() {
        this.el.removeEventListener('touchend', this._showActionBar.bind(this), { passive: false });
        this.el.addEventListener('touchend', this._showActionBar.bind(this), { passive: false });
    }

    /**
     * Add class hover to show action bar
     * when touch in product box
     * @private
     */
    _showActionBar(event) {
        if (!this.el.parentNode.classList.contains(HOVER_CLASS)) {
            if (event.cancelable) {
                event.preventDefault();
            }
            this._hideOtherProductBoxActionBar();
            this.el.parentNode.classList.add(HOVER_CLASS);
        }
    }

    /**
     * Hide other product box action bar
     * when touch in product box
     * @private
     */
    _hideOtherProductBoxActionBar() {
        Array.from(document.querySelectorAll(this.options.productBoxSelector)).forEach(productBox => {
            if (productBox.classList.contains(HOVER_CLASS)) {
                productBox.classList.remove(HOVER_CLASS);
            }
        });
    }
}
