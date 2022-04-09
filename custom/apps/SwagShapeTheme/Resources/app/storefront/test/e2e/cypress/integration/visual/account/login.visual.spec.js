import AccountPageObject from '../../../support/pages/account.page-object';

const accountPage = new AccountPageObject();

describe('Account: Visual tests login as customer', () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => cy.createCustomerFixtureStorefront())
            .then(() => cy.visit('/'))
            .then(() => {
                cy.get('.js-cookie-configuration-button > .btn').should('be.visible').click();
                cy.get('.offcanvas-cookie > .btn').scrollIntoView().should('be.visible').click();
            });
    });

    it('@visual: check appearance of login with wrong credentials', () => {
        cy.get('.account-menu [type="button"]').click();
        cy.get('.account-menu-dropdown').should('be.visible');

        cy.get('.account-menu-login-button').click();
        accountPage.login();

        cy.get('.account-welcome h1').contains('Hello');
        cy.takeSnapshot('[Account] Login', '.account');
    });
});
