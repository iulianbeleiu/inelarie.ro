import AccountPageObject from '../../../support/pages/account.page-object';

describe('Account: Overview page', { tags: ['@workflow', '@account'] }, () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => {
                return cy.createCustomerFixtureStorefront()
            })
            .then(() => {
                cy.visit('/account/login');
            })
    });

    it('@workflow @account: account overview workflow', () => {
        const accountPage = new AccountPageObject();
        accountPage.login();

        cy.get('.account-welcome h1').contains('Hello')

        cy.get('.account-overview-profile').should('be.visible');
        cy.get('.account-overview-newsletter').should('be.visible');
        cy.get('#newsletterRegister').should('not.be.visible')
            .check({ force: true })
            .should('be.checked');

        cy.get('.newsletter-alerts').should((element) => {
            expect(element).to.contain('You have subscribed to the newsletter');
        });

        cy.get('.overview-billing-address [data-address-editor="true"]').click();
        cy.get('.address-editor-modal').should('be.visible');

        cy.get('.address-editor-edit').click();
        cy.get('#billing-address-create-edit').should('have.class', 'show');
        cy.get('#billing-address-create-new').should('not.have.class', 'show');

        cy.get('.address-editor-create').click();
        cy.get('#billing-address-create-new').should('have.class', 'show');
        cy.get('#billing-address-create-edit').should('not.have.class', 'show');
        cy.get('.address-editor-modal').find('.modal-close').click();
        cy.get('.overview-shipping-address [data-address-editor="true"]').click();
        cy.get('.address-editor-modal').should('be.visible');

        cy.get('.address-editor-edit').click();
        cy.get('#shipping-address-create-edit').should('have.class', 'show');
        cy.get('#shipping-address-create-new').should('not.have.class', 'show');

        cy.get('.address-editor-create').click();
        cy.get('#shipping-address-create-new').should('have.class', 'show');
        cy.get('#shipping-address-create-edit').should('not.have.class', 'show');
    });
});
