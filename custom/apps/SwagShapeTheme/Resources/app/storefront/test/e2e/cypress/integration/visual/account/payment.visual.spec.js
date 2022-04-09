import AccountPageObject from '../../../support/pages/account.page-object';

describe('Account: Payment page', () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => cy.createCustomerFixtureStorefront())
            .then(() => cy.visit('/'))
            .then(() => {
                cy.get('.js-cookie-configuration-button > .btn').should('be.visible').click();
                cy.get('.offcanvas-cookie > .btn').scrollIntoView().should('be.visible').click();
            });
    });

    it('@visual: change payment visual test', () => {
        const accountPage = new AccountPageObject();

        cy.visit('/account/login');
        accountPage.login();

        cy.get('.account-content .account-aside-item[title="Payment methods"]')
            .should('be.visible')
            .click();

        cy.get('.account-welcome h1').contains('Payment methods');

        cy.get('.payment-method:nth-child(2) input[name="paymentMethodId"]').should('not.be.visible')
            .check({ force: true })
            .should('be.checked');
        cy.get('.account-payment-card [type="submit"]').click();
        cy.get('.alert-success .alert-content').contains('Payment method has been changed.');

        cy.takeSnapshot('[Payment] Change default payment method', '.account-payment');
    });
});
