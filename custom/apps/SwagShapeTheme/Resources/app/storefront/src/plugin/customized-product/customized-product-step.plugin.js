import DomAccess from 'src/helper/dom-access.helper';
import deepmerge from 'deepmerge';

function wrapper() {
    try {
        const SwagCustomizedProductsStepByStepWizard = window.PluginManager.getPlugin('SwagCustomizedProductsStepByStepWizard').get('class');

        class CustomizedProductsStepByStepWizard extends SwagCustomizedProductsStepByStepWizard {

            static options = deepmerge(SwagCustomizedProductsStepByStepWizard.options, {
                pagerNumberSelector: '.swag-customized-products__pager-number',
                productTitleSelector: '.swag-customized-products__title',
                productDescriptionSelector: '.swag-customized-products__description',
            });

            /**
             * Event handler which will be fired when the user changes a form field within the buy form
             * @returns {void}
             */
            onFormChanged() {
                super.onFormChanged();
                this.renderPagerNumber();
            }

            /**
             * Validates the current field and checks if the field is valid
             * @event input
             * @params event
             */
            validateCurrentField() {
                super.validateCurrentField();
                this.renderPagerNumber();
            }

            /**
             * Transitions to the given page and updates the current page as well as the pager.
             *
             * @params {Number} newPage
             * @params {Boolean} [setHistoryEntry=true]
             * @returns {boolean}
             */
            transitionToPage(newPage, setHistoryEntry = true) {
                super.transitionToPage(newPage, setHistoryEntry);
                this.renderPagerNumber();
            }

            /**
             * Returns the template string of the pager, including navigation buttons
             *
             * @returns {String}
             */
            renderPager() {
                /** Should the pager be visible */
                const showPager = () => {
                    return this.currentPage <= 1 || this.currentPage >= this.pagesCount;
                };

                /** Returns the disable attribute for the prev button */
                const disableBtnPrev = () => {
                    return this.currentPage <= 1 ? ' disabled="disabled"' : '';
                };

                /** Returns the disable attribute for the next button */
                const disableBtnNext = () => {
                    const currentPage = this.pages[this.currentPage - 1];
                    if (!SwagCustomizedProductsStepByStepWizard.isPageValid(currentPage)) {
                        return ' disabled="disabled"';
                    }
                    return this.currentPage >= this.pagesCount ? ' disabled="disabled"' : '';
                };

                /** Returns the button text for the next button */
                const btnNextText = () => {
                    if ((this.currentPage - 1) >= (this.pagesCount - 2)) {
                        return this.translations.btnFinish;
                    }
                    return this.translations.btnNext;
                };

                return `
                    <div class="swag-customized-products-pager${showPager() ? ' d-none' : ''}">
                        <button class="swag-customized-products-pager__button btn-prev btn btn-sm btn-link" tabindex="0"
                                ${disableBtnPrev()}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g class="nc-icon-wrapper"><path fill="currentColor" fill-rule="evenodd" d="M14.707 15.293a1 1 0 1 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 1 1 1.414 1.414L11.414 12l3.293 3.293z"/></g></svg>
                            ${this.translations.btnPrev}
                        </button>

                        <button class="swag-customized-products-pager__button btn-next btn btn-sm btn-outline-primary" tabindex="0"
                                ${disableBtnNext()}>
                            ${btnNextText()}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g class="nc-icon-wrapper"><path fill="currentColor" fill-rule="evenodd" d="M9.293 15.293a1 1 0 1 0 1.414 1.414l4-4a1 1 0 0 0 0-1.414l-4-4a1 1 0 1 0-1.414 1.414L12.586 12l-3.293 3.293z"/></g></svg>
                        </button>
                    </div>
                `;
            }

            renderPagerNumber() {
                const pageDisplay = () => {
                    return `${this.currentPage - 1} / ${this.pagesCount - 2}`;
                };

                Array.from(document.querySelectorAll(this.options.pagerNumberSelector)).forEach(pagerNumberEl => {
                    pagerNumberEl.innerHTML = `${pageDisplay()}`;
                });
            }

            /**
             * Renders a navigation select field which allows to quickly jump between the steps.
             *
             * @returns {string}
             */
            renderNavigationSelection() {
                const title = DomAccess.querySelector(this.el, this.options.productTitleSelector);
                const description = DomAccess.querySelector(this.el, this.options.productDescriptionSelector, false);
                return description ? `
                    ${title.outerHTML}
                    ${description.outerHTML}
                ` : `${title.outerHTML}`;
            }
        }

        return CustomizedProductsStepByStepWizard;
    } catch (e) { }
}

export default wrapper()
