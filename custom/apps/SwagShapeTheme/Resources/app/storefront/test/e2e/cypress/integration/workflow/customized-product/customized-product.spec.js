const waitingTimeForNextButton = 400;
const waitingTimeForFlatpickr = 300;

let product;

function nextButton() {
    // Click Next button in step by step mode
    cy.get('.swag-customized-products-pager__button.btn-next').should('be.visible');
    cy.wait(waitingTimeForNextButton);
    cy.get('.swag-customized-products-pager__button.btn-next').click();
}

describe('Customized Product: Visual tests product with full customize option', { tags: ['@workflow', '@CustomizedProduct'] }, () => {
    beforeEach(() => {
        return cy.setToInitialState().then(() => {
            return cy.createDefaultFixture('category')
                .then(() => cy.fixture('customized-product/product'))
                .then((fixtureProduct) => {
                    product = fixtureProduct;
                    return cy.searchViaAdminApi({
                        endpoint: 'tax',
                        data: {field: 'name', value: 'Standard rate'}
                    });
                })
                .then((tax) => {
                    product.swagCustomizedProductsTemplate.options = product.swagCustomizedProductsTemplate.options.map((value) => {
                        value.taxId = tax.id;
                        if (!Object.prototype.hasOwnProperty.call(value, 'values')) {
                            return value;
                        }
                        value.values = value.values.map((item) => {
                            item.taxId = tax.id;
                            return item;
                        });
                        return value;
                    });
                })
                .then(() => cy.createProductFixture(product))
                .then(() => cy.createCustomerFixtureStorefront())
        })
    });

    it('@workflow @customized: Customized product with all options', () => {
        cy.visit('Customized-Product/RS-333');

        // Check for the price box
        cy.get('.swag-customized-product__price-display').should('not.exist');
        cy.get('.swag-customized-product__price-display').should('be.exist');

        // Check for the product price
        cy.contains('.price-display__product-price > .price-display__label', 'Product price');
        cy.contains('.price-display__product-price > .price-display__price', '€10.00*');

        // Check the total price
        cy.contains('.price-display__total-price > .price-display__price', '€50.00*');

        // Select field (required)
        cy.contains('.swag-customized-products-option__title', 'Example select').should('be.visible');
        cy.get('div[data-name="Example select"] .swag-customized-products-option-type-select-wrapper .custom-control:nth-child(1) input').should('have.attr', 'checked');
        cy.contains('.swag-customized-products-option-type-select-checkboxes-label__property', 'Example #1')
            .should('be.visible');
        cy.contains('.swag-customized-products-option-type-select-checkboxes-label__property', 'Example #2')
            .should('be.visible')
            .click();

        // Check for the price box
        cy.get('.swag-customized-product__price-display').should('be.exist');

        // Check unit price
        cy.contains('.list__unit-price .price-display__item:nth-child(2) > .price-display__label', 'Example #2');
        cy.contains('.list__unit-price .price-display__item:nth-child(2) > .price-display__price', '€10.00*');

        // Check one time price
        cy.contains('.list__one-time-price .price-display__item .price-display__label', 'Example select');
        cy.contains('.list__one-time-price .price-display__item .price-display__price', '€10.00*');

        // Total price
        cy.contains('.price-display__total-price > .price-display__price', '€50.00*');

        // Checkbox
        cy.contains('.custom-control-label', 'Example checkbox').should('not.be.visible');
        cy.contains('.swag-customized-products-option__title', 'Example checkbox')
            .should('be.visible')
            .click();
        cy.contains('.custom-control-label', 'Example checkbox')
            .should('be.visible')
            .click();

        // Check price display
        cy.get('.swag-customized-product__price-display').should('be.exist');
        cy.contains('.list__one-time-price .price-display__item:nth-child(2) .price-display__label', 'Example checkbox');
        cy.contains('.list__one-time-price .price-display__item:nth-child(2) .price-display__price', '€10.00*');

        // Total price
        cy.contains('.price-display__total-price > .price-display__price', '€60.00*');

        // Textfield (required)
        cy.contains('.swag-customized-products-option__title', 'Example textfield')
            .should('be.visible');
        cy.get('.swag-customized-products__type-textfield input')
            .should('be.visible')
            .type('Hello Customized Products Textfield{enter}');

        // Check price display
        cy.get('.swag-customized-product__price-display').should('be.exist');
        cy.contains('.list__one-time-price .price-display__item:nth-child(3) .price-display__label', 'Example textfield');
        cy.contains('.list__one-time-price .price-display__item:nth-child(3) .price-display__price', '€10.00*');

        // Total price
        cy.contains('.price-display__total-price > .price-display__price', '€70.00*');

        // Textarea (required);
        cy.get('.swag-customized-products__type-textarea textarea').should('be.visible');
        cy.get('.swag-customized-products__type-textarea textarea')
            .should('be.visible')
            .type('Hello Customized Products Textarea')
            .blur();
        cy.contains('.swag-customized-products-option__title', 'Example textarea').click();

        // Check price display
        cy.get('.swag-customized-product__price-display').should('be.exist');
        cy.contains('.list__one-time-price .price-display__item:nth-child(4) .price-display__label', 'Example textarea');
        cy.contains('.list__one-time-price .price-display__item:nth-child(4) .price-display__price', '€10.00*');

        // Total price
        cy.contains('.price-display__total-price > .price-display__price', '€80.00*');

        // Numberfield (required)
        cy.contains('.swag-customized-products-option__title', 'Example numberfield').should('be.visible');
        cy.get('.swag-customized-products__type-numberfield input')
            .should('be.visible')
            .type('42');
        cy.contains('.swag-customized-products-option__title', 'Example numberfield').click();

        // Total price
        cy.contains('.price-display__total-price > .price-display__price', '€90.00*');

        // Datefield
        cy.get('.swag-customized-products__type-datetime > .input-group > input[type="text"].swag-customized-products-options-datetime')
            .should('not.be.visible');
        cy.contains('.swag-customized-products-option__title', 'Example datefield')
            .should('be.visible')
            .click();
        cy.get('.swag-customized-products__type-datetime > .input-group > input[type="text"].swag-customized-products-options-datetime')
            .should('be.visible')
            .click();
        cy.get('.flatpickr-calendar').should('be.visible');
        cy.get('.flatpickr-day.today').click();

        // Price display
        cy.get('.swag-customized-product__price-display').should('be.exist');
        cy.contains('.list__one-time-price .price-display__item:nth-child(6) .price-display__label', 'Example datefield');
        cy.contains('.list__one-time-price .price-display__item:nth-child(6) .price-display__price', '€10.00*');

        // Total price
        cy.contains('.price-display__total-price > .price-display__price', '€100.00*');

        // Time field
        cy.get('.swag-customized-products__type-timestamp > .input-group > input[type="text"].swag-customized-products-options-datetime')
            .should('not.be.visible');
        cy.contains('.swag-customized-products-option__title', 'Example timefield')
            .should('be.visible')
            .click();
        cy.get('.swag-customized-products__type-timestamp > .input-group > input[type="text"].swag-customized-products-options-datetime')
            .should('be.visible')
            .click();
        cy.get('.flatpickr-calendar').should('be.visible');
        cy.get('.numInputWrapper .flatpickr-hour').type('3');

        // Price display
        cy.get('.swag-customized-product__price-display').should('be.exist');
        cy.contains('.list__one-time-price .price-display__item:nth-child(7) .price-display__label', 'Example timefield');
        cy.contains('.list__one-time-price .price-display__item:nth-child(7) .price-display__price', '€10.00*');

        // Total price
        cy.contains('.price-display__total-price > .price-display__price', '€110.00*');

        // Color select
        cy.contains('.swag-customized-products-option-type-select-checkboxes-label__property', 'Example Purple')
            .should('not.be.visible');
        cy.contains('.swag-customized-products-option__title', 'Example color select')
            .should('be.visible')
            .click({force: true});

        cy.contains('.swag-customized-products-option-type-select-checkboxes-label__property', 'Example Blue')
            .should('be.visible')
            .click({force: true});

        // Price display
        cy.get('.swag-customized-product__price-display').should('be.exist');
        cy.contains('.list__one-time-price .price-display__item:nth-child(8) .price-display__label', 'Example color select');
        cy.contains('.list__one-time-price .price-display__item:nth-child(8) .price-display__price', '€10.00*');

        cy.contains('.list__unit-price .price-display__item:nth-child(3) > .price-display__label', 'Example Blue');
        cy.contains('.list__unit-price .price-display__item:nth-child(3) > .price-display__price', '€10.00*');

        // Total price
        cy.contains('.price-display__total-price > .price-display__price', '€110.00*').should('be.visible');

        // Expand all configuration
        cy.get('.swag-customized-products-option .toggle-icon-plus').each(($el) => {
            if (Cypress.dom.isVisible($el)) {
                cy.wrap($el).click();
            }
        })

        // Add to cart
        cy.get('.product-detail-buy .btn-buy').click();

        // Off canvas cart
        cy.get('.offcanvas.is-open').should('be.visible');
        cy.get('.cart-item-label').contains(product.name);
        // Check the configuration
        cy.get('.cart-item-collapse-button').click();
        cy.contains('.cart-item-child-label-bullet', 'Example #2');

        // Checkout
        cy.get('.offcanvas-cart-actions .btn-primary').click();

        // Login
        cy.get('.checkout-main').should('be.visible');

        // TODO: using account page object
        cy.get('.login-collapse-toggle').click();
        cy.get('#loginMail').type('test@example.com');
        cy.get('#loginPassword').type('shopware');
        cy.get('.login-submit [type="submit"]').click();

        // Confirm
        cy.get('.checkout-confirm-tos-label').contains('I have read and accepted the general terms and conditions.');
        cy.get('.checkout-confirm-tos-label').scrollIntoView();
        cy.get('.checkout-confirm-tos-label').click(1, 1);
        cy.get('.cart-item-collapse-button').first().click()
        // Finish checkout
        cy.get('#confirmFormSubmit').scrollIntoView();
        cy.get('#confirmFormSubmit').click();
        cy.get('.finish-header').should('be.visible')

        // Let's check the calculation on /finish as well
        cy.contains(product.name);
        cy.get('.cart-item-collapse-button').first().click()
    })

    it('@workflow @customized: Customized product step by step mode', () => {
        cy.fixture('customized-product/step-by-step-wizard-patch.json')
            .then((data) => {
                return cy.patchViaAdminApi({endpoint: `swag-customized-products-template/${data.id}`, data: {data}});
            })
            .then(() => {
                cy.visit('Customized-Product/RS-333');

                // Start wizard
                cy.get('.swag-customized-products-start-wizard.btn-primary').should('be.visible');
                cy.contains('.swag-customized-products-start-wizard.btn-primary', 'Configure product').click();

                // Select field
                cy.contains('.swag-customized-products-option__title', 'Example select').scrollIntoView();
                cy.contains('.swag-customized-products-option-type-select-checkboxes-label__property', 'Example #2').click();
                nextButton()

                // Checkbox
                cy.contains('.swag-customized-products-option__title', 'Example checkbox').scrollIntoView();
                cy.contains('.custom-control-label', 'Example checkbox').click();
                nextButton()

                // Textfield
                cy.contains('.swag-customized-products-option__title', 'Example textfield').scrollIntoView();
                cy.get('.swag-customized-products__type-textfield input').type('Hello Customized Products Textfield StepByStep');
                nextButton();

                // Textarea
                cy.contains('.swag-customized-products-option__title', 'Example textarea').scrollIntoView();
                cy.get('.swag-customized-products__type-textarea textarea').type('Hello Customized Products Textarea StepByStep');
                nextButton();

                // Numberfield
                cy.contains('.swag-customized-products-option__title', 'Example numberfield').scrollIntoView();
                cy.get('.swag-customized-products__type-numberfield input').type('42');
                nextButton();

                // Datefield
                cy.contains('.swag-customized-products-option__title', 'Example datefield').scrollIntoView();
                cy.get('.swag-customized-products__type-datetime > .input-group > input[type="text"].swag-customized-products-options-datetime').click();
                cy.get('.flatpickr-calendar').should('be.visible');
                cy.get('.flatpickr-day.today').click();
                // We have to wait here to update the pager, the flatpickr is kinda weird in this regard
                cy.wait(waitingTimeForFlatpickr);
                nextButton();

                // Time field
                cy.contains('.swag-customized-products-option__title', 'Example timefield').scrollIntoView();
                cy.get('.swag-customized-products__type-timestamp > .input-group > input[type="text"].swag-customized-products-options-datetime').click();
                cy.get('.flatpickr-calendar').should('be.visible');
                cy.get('.numInputWrapper .flatpickr-hour').type('3{enter}');
                // We have to ait here to update the pager, the flatpickr is kinda weird in this regard
                cy.wait(waitingTimeForFlatpickr);
                nextButton();

                // Color select
                cy.contains('.swag-customized-products-option__title', 'Example color select').scrollIntoView();
                cy.contains('.swag-customized-products-option-type-select-checkboxes-label__property', 'Example Blue').click();
                nextButton()

                // File upload
                cy.contains('.swag-customized-products-option__title', 'Example file upload').scrollIntoView();
                nextButton()

                // Image upload
                cy.contains('.swag-customized-products-option__title', 'Example image upload').scrollIntoView();
                nextButton()

                // HTML Input
                cy.contains('.swag-customized-products-option__title', 'Example html').scrollIntoView();
                // cy.get('.swag-custommized-product-html-editor__editor').should('be.visible').focus().type('Hello Customized Products HTML')
                nextButton()

                // Check if the configuration was done
                cy.contains('.swag-customized-products-start-wizard', 'Change configuration').should('be.visible');
                // Add to cart
                cy.get('.product-detail-buy .btn-buy').click();

                // Off canvas cart
                cy.get('.offcanvas.is-open').should('be.visible');
                cy.get('.cart-item-label').contains(product.name);

                // Check the configuration
                cy.get('.cart-item-collapse-button').click();
                cy.contains('.cart-item-child-label-bullet', 'Example #2');

                // Checkout
                cy.get('.offcanvas-cart-actions .btn-primary').click();

                // Login
                cy.get('.checkout-main').should('be.visible');

                // TODO: using account page object
                cy.get('.login-collapse-toggle').click();
                cy.get('#loginMail').type('test@example.com');
                cy.get('#loginPassword').type('shopware');
                cy.get('.login-submit [type="submit"]').click();

                // Confirm
                cy.get('.checkout-confirm-tos-label').contains('I have read and accepted the general terms and conditions.');
                cy.get('.checkout-confirm-tos-label').scrollIntoView();
                cy.get('.checkout-confirm-tos-label').click(1, 1);

                // Finish checkout
                cy.get('#confirmFormSubmit').scrollIntoView();
                cy.get('#confirmFormSubmit').click();
                cy.get('.finish-header').should('be.visible');

                // Let's check the calculation on /finish as well
                cy.contains(product.name);
            });
    });
});
