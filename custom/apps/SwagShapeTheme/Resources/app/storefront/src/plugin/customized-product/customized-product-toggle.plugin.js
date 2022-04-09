import Plugin from 'src/plugin-system/plugin.class';

export default class CustomizedProductTogglePlugin extends Plugin {

    static options = {
        expandedColor: '#dde2ed',
        collapseColor: '#637182',
    }

    init() {
        this._registerEvents();
        this._initColor();
    }

    /**
     * Register event listeners
     * @private
     */
    _registerEvents() {
        this.el.addEventListener('click', this._onClickCollapseTrigger.bind(this));
    }

    /**
     * Init border color of toggle parent
     * in case required field auto expand
     * @private
     */
    _initColor() {
        if (this.el.getAttribute('aria-expanded') === "true") {
            this.el.parentNode.style.borderColor = this.options.collapseColor;
        }
        else {
            this.el.parentNode.style.borderColor = this.options.expandedColor;
        }
    }

    /**
     * On clicking the collapse trigger
     * change border color of toggle parent
     * @private
     */
    _onClickCollapseTrigger(event) {
        event.preventDefault();

        if (this.el.getAttribute('aria-expanded') === "true") {
            this.el.parentNode.style.borderColor = this.options.expandedColor;
        }
        else {
            this.el.parentNode.style.borderColor = this.options.collapseColor;
        }
    }
}
