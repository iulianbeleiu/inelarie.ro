import AccountPageObject from '../../../support/pages/account.page-object';

const accountPage = new AccountPageObject();

describe('Account: Address', { tags: ['@workflow', '@address'] }, () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => {
                return cy.createCustomerFixtureStorefront()
            })
            .then(() => {
                cy.visit('/account/login');
            })
    });

    it('@workflow @address: update address', () => {
        accountPage.login();

        cy.get('.account-content .account-aside-item[title="Addresses"]')
            .should('be.visible')
            .click();

        cy.get('a[href="/account/address/create"]').click();

        cy.get('.account-address-form').should('be.visible');
        cy.get('#addresspersonalSalutation').select('Mr.');
        cy.get('#addresspersonalFirstName').typeAndCheckStorefront('P.  ');
        cy.get('#addresspersonalLastName').typeAndCheckStorefront('Sherman');
        cy.get('#addressAddressStreet').typeAndCheckStorefront('42 Wallaby Way');
        cy.get('#addressAddressZipcode').typeAndCheckStorefront('2000');
        cy.get('#addressAddressCity').typeAndCheckStorefront('Sydney');
        cy.get('#addressAddressCountry').select('Australia');
        cy.get('.address-form-submit').scrollIntoView();

        cy.get('.address-form-submit').click();
        cy.get('.alert-success .alert-content').contains('Address has been saved.');

        cy.get('#accountAddressActionsDropdown').click();
        cy.get('.dropdown-menu > .row > :nth-child(1) > .btn').contains('Change').click();
        cy.get('#addresscompany').typeAndCheckStorefront('Company ABD');
        cy.get('#addressdepartment').typeAndCheckStorefront('Department ABF');
        cy.get('#addressAddressCountry').select('Germany');
        cy.get('.address-form-submit').scrollIntoView();

        cy.get('.address-form-submit').click();
        cy.get('.alert-success .alert-content').contains('Address has been saved.');
    });
});
