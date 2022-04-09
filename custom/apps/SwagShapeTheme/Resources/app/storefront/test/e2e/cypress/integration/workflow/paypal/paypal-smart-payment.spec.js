// / <reference types="Cypress" />
import AccountPageObject from '../../../support/pages/account.page-object';
import CheckoutPageObject from "../../../support/pages/checkout.page-object";

const accountPage = new AccountPageObject();
const checkoutPage = new CheckoutPageObject();

let salesChannelId;
let product = {};

describe('Paypal: Checkout', { tags: ['@workflow', '@Paypal'] }, () => {
    before(() => {
        return cy.setToInitialState()
            .then(() => {
                // Search for storefront SalesChannel id
                return cy.searchViaAdminApi({
                    endpoint: 'sales-channel',
                    data: {
                        field: 'name',
                        value: 'Storefront'
                    }
                });
            })
            .then((salesChannelData) => {
                // Preserve salesChannelId for later use
                salesChannelId = salesChannelData.id;
                return cy.initializePluginConfig('paypal-config.json', '/api/_action/system-config/batch')
            })
            .then(() => {
                return cy.requestAdminApi(
                    'POST',
                    `/api/_action/paypal/saleschannel-default`,
                    {"salesChannelId": salesChannelId}
                )
            })
            .then(() => {
                return cy.createProductFixture();
            })
            .then(() => {
                return cy.fixture('product');
            })
            .then((result) => {
                product = result;
            })
    });

    it('@workflow @paypal: should display smart payment on the footer', () => {
        cy.intercept({
            path: '/api/_action/system-config/batch',
            method: 'POST'
        }).as('saveConfig')

        cy.loginViaApi();
        cy.visit('/admin#/swag/paypal/index');

        const merchantSelector = '.swag-paypal-settings-behavior-field > :nth-child(1) > .sw-single-select'
        cy.get(merchantSelector)
            .scrollIntoView()
            .typeSingleSelect('Other merchant location', merchantSelector);

        cy.get('.smart-bar__actions > .sw-button').click();

        cy.wait('@saveConfig');

        // visit on Storefront
        cy.visit('/');

        // verify on footer
        cy.get('div[data-swag-paypal-marks="true"] .paypal-logo-paypal').should('be.visible');

        cy.get('body').screenshot('smart-logo-in-footer');
    });

    it('@workflow @paypal: should be able to checkout using smart payment', () => {
        cy.visit('/');

        cy.createCustomerFixtureStorefront();

        // search product
        checkoutPage.search(product.name);

        cy.get('.search-suggest-product-name')
            .contains(product.name)
            .click();

        cy.screenshot('smart-paypal-button-in-product-detail--page');

        cy.get('.product-detail-buy .btn-buy').click();

        // Offcanvas
        cy.get('.offcanvas').scrollIntoView().should('be.visible');
        cy.wait(1000);
        cy.screenshot('smart-paypal-button-in-offcanvas-cart');
        cy.get('.offcanvas-cart-actions .begin-checkout-btn').click();

        // Login
        accountPage.getLoginCollapse().click();
        accountPage.login();

        // Confirm: Change payment method to "Paypal"
        cy.get('.paypal-marks').click();
        cy.get('div[data-swag-paypal-marks="true"] .paypal-logo-paypal').should('be.visible');

        cy.get('body').screenshot('smart-paypal-button-in-checkout-complete-order');
    })
})
