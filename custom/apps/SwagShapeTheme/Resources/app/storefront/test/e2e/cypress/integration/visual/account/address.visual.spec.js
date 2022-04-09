import AccountPageObject from '../../../support/pages/account.page-object';

describe('Account: Address page', () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => {
                return cy.createCustomerFixtureStorefront();
            })
            .then(() => {
                cy.visit('/');
            }).then(() => {
                cy.get('.js-cookie-configuration-button > .btn').should('be.visible').click();
                cy.get('.offcanvas-cookie > .btn').scrollIntoView().should('be.visible').click();
            });
    });

    it('@visual: update address page', () => {
        const accountPage = new AccountPageObject();

        cy.visit('/account/login');
        accountPage.login();

        cy.get('.account-content .account-aside-item[title="Addresses"]')
            .should('be.visible')
            .click();

        cy.get('.account-welcome h1').contains('Addresses');

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

        cy.takeSnapshot('[Address] Fill in Create new address form', '.account-address-form');
    });
});
