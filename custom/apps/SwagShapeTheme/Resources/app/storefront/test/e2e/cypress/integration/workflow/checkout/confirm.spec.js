import CheckoutPageObject from '../../../support/pages/checkout.page-object';

let product = {};
const checkoutPage = new CheckoutPageObject();

describe('Checkout: Payment and Shipping methods selection', {tags: ['@workflow', '@checkout']}, () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => {
                cy.createProductFixture();
            })
            .then((result) => {
                product = result;
                return cy.createCustomerFixtureStorefront();
            })
            .then(() => {
                cy.visit('/account/login');

                // Login
                cy.get('.login-card').should('be.visible');
                cy.get('#loginMail').typeAndCheckStorefront('test@example.com');
                cy.get('#loginPassword').typeAndCheckStorefront('shopware');
                cy.get('.login-submit [type="submit"]').click();

                cy.visit('/');
            });
    });

    it('@workflow @checkout: should show payment methods', () => {
        // search product
        checkoutPage.search(product.name)

        cy.get('.search-suggest-product-name')
            .contains(product.name)
            .click();
        cy.get('.product-detail-buy .btn-buy').click();

        // Off canvas
        cy.get(`${checkoutPage.elements.offCanvasCart}.is-open`).should('be.visible');
        cy.get(`${checkoutPage.elements.cartItem}-label`).contains(product.name);

        // Go to cart
        cy.get('.offcanvas-cart-actions [href="/checkout/confirm"]').click();

        cy.get(`${checkoutPage.elements.paymentFormConfirm}`).should('be.visible');
        cy.get(`${checkoutPage.elements.shippingFormConfirm}`).should('be.visible');

        cy.get(`${checkoutPage.elements.paymentMethodsContainer}`)
            .should('be.visible')
            .children()
            .should('have.length', 3);

        cy.get(`${checkoutPage.elements.shippingMethodsContainer}`)
            .should('be.visible')
            .children()
            .should('have.length', 2);
    });

    it('@workflow @checkout @confirm: should have working collapse on multiple methods', () => {
        cy.createPaymentMethodFixture({name: 'Test Method #1'})
            .then(() => {
                return cy.createPaymentMethodFixture({name: 'Test Method #2'});
            })
            .then(() => {
                return cy.createPaymentMethodFixture({name: 'Test Method #3'});
            })
            .then(() => {
                // add product to cart
                checkoutPage.search(product.name)

                cy.contains('.search-suggest-product-name', product.name).click();
                cy.get('.product-detail-buy .btn-buy').click();

                // Off canvas
                cy.get(`${checkoutPage.elements.offCanvasCart}.is-open`).should('be.visible');
                cy.get(`${checkoutPage.elements.cartItem}-label`).contains(product.name);

                // Go to cart
                cy.get('.offcanvas-cart-actions [href="/checkout/confirm"]').click();

                // check for correct collapsed state at checkoutPage initialization
                cy.get(`${checkoutPage.elements.paymentMethodsContainer}`)
                    .should('be.visible')
                    .children('.payment-method')
                    .should('have.length', 5);
                cy.get(`${checkoutPage.elements.paymentMethodsCollapseContainer}`).should('exist');
                cy.get(`${checkoutPage.elements.paymentMethodsCollapseContainer} > .payment-method`).should('not.be.visible');
                cy.get(`${checkoutPage.elements.paymentMethodsCollapseTrigger}`)
                    .should('be.visible')
                    .should('contain', 'Show more');

                // click collapse trigger to show other payment methods
                cy.get(`${checkoutPage.elements.paymentMethodsCollapseTrigger}`).click();
                cy.get(`${checkoutPage.elements.paymentMethodsCollapseContainer} > .payment-method`).should('be.visible');
                cy.get(`${checkoutPage.elements.paymentMethodsCollapseTrigger}`).should('contain', 'Show less');

                // click it again to collapse methods again
                cy.get(`${checkoutPage.elements.paymentMethodsCollapseTrigger}`).click();
                cy.get(`${checkoutPage.elements.paymentMethodsCollapseContainer}`).should('exist'); // wait for collapse to finish transition
                cy.get(`${checkoutPage.elements.paymentMethodsCollapseContainer} > .payment-method`).should('not.be.visible');
                cy.get(`${checkoutPage.elements.paymentMethodsCollapseTrigger}`).should('contain', 'Show more');
            });
    });

    it('@workflow @confirm: should change payment and shipping methods', () => {
        // search product
        checkoutPage.search(product.name);

        cy.contains('.search-suggest-product-name', product.name).click();
        cy.get('.product-detail-buy .btn-buy').click();

        // Off canvas
        cy.get(`${checkoutPage.elements.offCanvasCart}.is-open`).should('be.visible');
        cy.get(`${checkoutPage.elements.cartItem}-label`).contains(product.name);

        // Go to cart
        cy.get('.offcanvas-cart-actions [href="/checkout/confirm"]').click();

        cy.get('.confirm-tos .custom-checkbox label').scrollIntoView();
        cy.get('.confirm-tos .custom-checkbox label').click(1, 1);

        cy.get(`${checkoutPage.elements.paymentMethodsContainer} > :nth-child(3) .payment-method-label`)
            .should('exist')
            .contains('Paid in advance');
        cy.get(`${checkoutPage.elements.paymentMethodsContainer} > :nth-child(3) .payment-method-label`).click(1, 1);

        cy.get(`${checkoutPage.elements.shippingMethodsContainer} .shipping-method-label`)
            .contains('Express').click(1, 1);

        cy.get('#confirmFormSubmit').scrollIntoView();
        cy.get('#confirmFormSubmit').click();

        cy.get('.finish-header').contains('Thank you for your order with Demostore!');
    });
});
