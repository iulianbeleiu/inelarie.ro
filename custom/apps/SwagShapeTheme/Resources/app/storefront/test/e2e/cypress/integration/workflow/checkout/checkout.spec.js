import CheckoutPageObject from '../../../support/pages/checkout.page-object';
import AccountPageObject from '../../../support/pages/account.page-object';

let product = {};
const checkoutPage = new CheckoutPageObject();
const accountPage = new AccountPageObject();

describe('Checkout: Basic', {tags: ['@workflow', '@checkout']}, () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => {
                return cy.createProductFixture();
            })
            .then(() => {
                return cy.fixture('product');
            })
            .then((result) => {
                product = result;
                return cy.createCustomerFixtureStorefront();
            })
            .then(() => {
                cy.visit('/');
            });
    });

    it('@workflow @checkout: basic checkout workflow', () => {
        // Product detail
        checkoutPage.search(product.name);

        cy.get('.search-suggest-product-name').contains(product.name);
        cy.get('.search-suggest-product-name').click();
        cy.get('.product-detail-buy .btn-buy').click();

        // Offcanvas
        cy.get('.offcanvas').should('be.visible');
        cy.get('.cart-item-price').contains('64');
        cy.contains('Continue shopping').should('be.visible');
        cy.contains('Continue shopping').click();

        cy.wait(500);
        cy.get('.header-cart-count').contains(1);
        cy.get('[data-offcanvas-cart="true"] > .btn').click();
        cy.get(`${checkoutPage.elements.cartItem}-label`).contains(product.name);

        // Checkout
        cy.get('.offcanvas-cart-actions .btn-primary').click();

        // Login
        cy.get('.checkout-main').should('be.visible');
        accountPage.getLoginCollapse().click();
        accountPage.login();

        cy.get('.confirm-tos .custom-checkbox label').scrollIntoView();
        cy.get('.confirm-tos .custom-checkbox label').click(1, 1);
        cy.get('.confirm-address').contains('Pep Eroni');
        cy.get(`${checkoutPage.elements.cartItem}-details-container ${checkoutPage.elements.cartItem}-label`).contains(product.name);
        cy.get(`${checkoutPage.elements.cartItem}-total-price`).contains(product.price[0].gross);

        // Finish checkout
        cy.get('#confirmFormSubmit').scrollIntoView();
        cy.get('#confirmFormSubmit').click();
    });
});
