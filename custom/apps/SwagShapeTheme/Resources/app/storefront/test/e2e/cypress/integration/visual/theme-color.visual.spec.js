import AccountPageObject from "../../support/pages/account.page-object";
import ThemePageObject from "../../support/pages/theme.page-object";

let colorScheme = {};
const accountPage = new AccountPageObject();

describe('ThemeColor: Visual tests', () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => cy.setShippingMethodInSalesChannel('Standard'))
            .then(() => cy.createProductFixture())
            .then(() => cy.createCustomerFixtureStorefront())
            .then(() => cy.loginViaApi())
            .then(() => {
                return cy.openInitialPage(`${Cypress.env('admin')}#/sw/theme/manager/index`);
            })
            .then(() => cy.fixture('color-scheme.json'))
            .then((colorSchemeFixture) => {
                colorScheme = colorSchemeFixture;
                return ThemePageObject.changeColorScheme(colorSchemeFixture);
            })
            .then(() => cy.visit('/'))
            .then(() => {
                cy.get('.js-cookie-configuration-button > .btn').should('be.visible').click();
                cy.get('.offcanvas-cookie > .btn').scrollIntoView().should('be.visible').click();
            });
    });

    after(() => {
        return cy.setToInitialState()
            .then(() => {
                cy.clearCookies();
            })
            .then(() => {
                cy.loginViaApi()
            })
            .then(() => {
                cy.visit(`${Cypress.env('admin')}#/sw/theme/manager/index`);
                cy.intercept({
                    path: `${Cypress.env('apiPath')}/_action/theme/*`,
                    method: 'patch'
                }).as('saveData');

                cy.get('.sw-theme-list-item .sw-theme-list-item__title')
                    .contains('Shape Theme')
                    .click();

                cy.get('.smart-bar__actions .sw-button-process.sw-button--primary').click();
                cy.get('.sw-modal .sw-button--primary').click();

                cy.wait('@saveData').then((xhr) => {
                    expect(xhr.response).to.have.property('statusCode', 200);
                });
            })
    });

    it('@visual @themeColor: check change primary color ', () => {
        cy.intercept({
            path: '/widgets/checkout/info',
            method: 'get'
        }).as('cartInfo');

        cy.takeSnapshot('[Theme Color] Home Page', '.is-act-home');

        // hover over product-box
        cy.get('.product-box').first().invoke('addClass', 'hover');
        cy.get('.product-image-link').click();
        cy.takeSnapshot('[Theme Color] Product Detail Page', '.product-detail-content');


        cy.get('.product-detail-buy .btn-buy').click();
        cy.wait('@cartInfo').then((xhr) => {
            expect(xhr.response).to.have.property('statusCode', 200)
        });
        cy.get('.cart-offcanvas').should('be.visible');
        cy.wait(500);
        cy.takeSnapshot('[Theme Color] Cart Offcanvas', '.cart-offcanvas');

        // checkout cart page
        cy.get('.offcanvas-cart-actions .btn-link').click();
        cy.takeSnapshot('[Theme Color] Shopping cart', '.checkout');

        // finish checkout page
        cy.get('.checkout-aside-action .begin-checkout-btn').click();

        // checkout login
        accountPage.getLoginCollapse().click();
        accountPage.login();

        cy.get('.checkout-confirm-tos-checkbox').should('not.be.visible')
            .check({force: true})
            .should('be.checked');
        cy.takeSnapshot('[Theme Color] Checkout - Complete order', '.checkout');

        // thank you page
        cy.get('#confirmFormSubmit').scrollIntoView();
        cy.get('#confirmFormSubmit').click();
        cy.takeSnapshot('[Theme Color] Checkout - Thank you page', '.checkout');

        // account overview page
        cy.visit('/account');
        cy.changeElementStyling('.order-table-header-heading', 'display: none');
        cy.takeSnapshot('[Theme Color] Account Overview page', '.account');
    });
});
