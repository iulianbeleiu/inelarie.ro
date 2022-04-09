import CheckoutPageObject from '../../../support/pages/checkout.page-object';
import AccountPageObject from '../../../support/pages/account.page-object';

let product = {};
const accountPage = new AccountPageObject();
const checkoutPage = new CheckoutPageObject();

describe('Checkout: Visual tests', () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => cy.setShippingMethodInSalesChannel('Standard'))
            .then(() => cy.createProductFixture())
            .then(() => cy.fixture('product'))
            .then((result) => {
                product = result;
                return cy.createCustomerFixtureStorefront();
            })
            .then(() => cy.visit('/'))
            .then(() => {
                cy.get('.js-cookie-configuration-button > .btn').should('be.visible').click();
                cy.get('.offcanvas-cookie > .btn').scrollIntoView().should('be.visible').click();
            });
    });

    it('@visual @checkout: check appearance of basic checkout workflow', () => {
        cy.intercept({
            path: '/widgets/checkout/info',
            method: 'get'
        }).as('cartInfo');

        // search product
        checkoutPage.search(product.name);
        cy.get('.search-suggest-product-name').contains(product.name);

        cy.takeSnapshot('[Checkout] Search product result', '.header-search');

        cy.get('.search-suggest-product-name').click();
        cy.get('.product-detail-buy .btn-buy').click();
        cy.wait('@cartInfo').then((xhr) => {
            expect(xhr.response).to.have.property('statusCode', 200)
        });

        // Offcanvas
        cy.get('.offcanvas').should('be.visible');
        cy.get('.cart-item-price').contains('64');
        cy.get('.offcanvas').should('be.visible');
        cy.contains('Continue shopping').should('be.visible');
        cy.contains('Continue shopping').click();

        cy.wait(500);
        cy.get('[data-offcanvas-cart="true"] > .btn').click();

        cy.wait('@cartInfo').then((xhr) => {
            expect(xhr.response).to.have.property('statusCode', 200)
        });

        cy.get('.offcanvas').should('be.visible');
        cy.wait(1000);
        cy.takeSnapshot('[Checkout] Offcanvas open', `${checkoutPage.elements.offCanvasCart}.is-open`);

        // Checkout
        cy.get(`${checkoutPage.elements.cartItem}-label`).contains(product.name);
        cy.get('.offcanvas-cart-actions .btn-primary').click();

        // Login
        cy.get('.checkout-main').should('be.visible');
        accountPage.getLoginCollapse().click();
        accountPage.login();

        // Confirm
        cy.get('.confirm-tos .custom-checkbox label').scrollIntoView();
        cy.get('.confirm-tos .custom-checkbox label').click(1, 1);
        cy.get('.confirm-address').contains('Pep Eroni');

        cy.get(`${checkoutPage.elements.cartItem}-details-container ${checkoutPage.elements.cartItem}-label`).contains(product.name);
        cy.get(`${checkoutPage.elements.cartItem}-total-price`).contains(product.price[0].gross);
        cy.get(`${checkoutPage.elements.cartItem}-total-price`).contains(product.price[0].gross);

        // Finish checkout
        cy.get('#confirmFormSubmit').scrollIntoView();
        cy.get('#confirmFormSubmit').click();

        // Take snapshot for visual testing on desktop
        cy.takeSnapshot('[Checkout] Finish', '.finish-header');
    });

    it('@visual @checkout: checkout empty cart', () => {
        cy.visit('/checkout/cart');
        cy.takeSnapshot('[Checkout] Empty cart', '.is-act-cartpage');
    })

    it('@visual @checkout: checkout cart', () => {
        cy.get('.btn-buy').click();

        // Checkout
        cy.get('.offcanvas-cart-actions .btn-link').click();
        cy.get('.cart-shipping-costs-btn').click();

        cy.takeSnapshot('[Checkout] Cart page', '.is-act-cartpage');
    })
});
