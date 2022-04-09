import AccountPageObject from '../../../support/pages/account.page-object';

describe('Account: Payment page', { tags: ['@workflow', '@payment'] }, () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => {
                return cy.createCustomerFixtureStorefront()
            })
            .then(() => {
                cy.visit('/account/login');
            })
    });

    it('@workflow @payment: change payment workflow', () => {
        const accountPage = new AccountPageObject();
        accountPage.login();

        cy.get('.account-content .account-aside-item[title="Payment methods"]')
            .should('be.visible')
            .click();

        cy.get('.account-welcome h1').contains('Payment methods')

        cy.get('.payment-method:nth-child(2) input[name="paymentMethodId"]').should('not.be.visible')
            .check({ force: true })
            .should('be.checked');
        cy.get('.account-payment-card [type="submit"]').click();
        cy.get('.alert-success .alert-content').contains('Payment method has been changed.');
    });
});
