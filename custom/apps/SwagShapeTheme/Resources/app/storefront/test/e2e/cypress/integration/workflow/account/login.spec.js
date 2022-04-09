import AccountPageObject from '../../../support/pages/account.page-object';

describe('Account: Visual tests login as customer', {tags: ['@workflow', '@login']}, () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => cy.createCustomerFixtureStorefront())
            .then(() => cy.visit('/'))
    });

    it('@workflow @login: check appearance of login with wrong credentials', () => {
        const accountPage = new AccountPageObject();

        cy.get('.account-menu [type="button"]').click();
        cy.get('.account-menu-dropdown').should('be.visible');

        cy.get('.account-menu-login-button').click();
        accountPage.login('test@example.com', 'Anything');

        cy.get('.alert-danger').should((element) => {
            expect(element).to.contain('Could not find an account that matches the given credentials.');
        });

        accountPage.login();
        cy.get('.account-welcome h1').contains('Hello')
    });
});
