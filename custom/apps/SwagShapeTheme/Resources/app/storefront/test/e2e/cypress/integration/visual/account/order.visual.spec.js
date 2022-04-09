import AccountPageObject from '../../../support/pages/account.page-object';

const accountPage = new AccountPageObject();

describe('Account: Order page', () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => cy.setShippingMethodInSalesChannel('Standard'))
            .then(() => cy.createProductFixture())
            .then(() => cy.fixture('product'))
            .then((result) => cy.createCustomerFixtureStorefront())
            .then(() => {
                return cy.searchViaAdminApi({
                    endpoint: 'product',
                    data: {
                        field: 'name',
                        value: 'Product name'
                    }
                });
            })
            .then((result) => {
                return cy.createOrder(result.id, {
                    username: 'test@example.com',
                    password: 'shopware'
                });
            })
            .then(() => cy.visit('/'))
            .then(() => {
                cy.get('.js-cookie-configuration-button > .btn').should('be.visible').click();
                cy.get('.offcanvas-cookie > .btn').scrollIntoView().should('be.visible').click();
            });
    });

    it('@visual: order page', () => {
        cy.visit('/account/order');

        // Login
        accountPage.login();

        cy.changeElementStyling('.order-table-header-heading', 'display: none');
        cy.get('.order-table-header-heading')
            .should('have.css', 'display', 'none');

        // Order detail is expandable
        cy.get('.order-table').should('be.visible');
        cy.get('.order-table:nth-of-type(1) .order-table-header-order-number').contains('Order number: 10000');

        cy.get('.order-table:nth-of-type(1) .order-hide-btn').click();
        cy.get('.order-detail-content').should('be.visible');

        cy.changeElementStyling('.order-item-detail-labels-value:nth-of-type(1)', 'visibility: hidden');
        cy.takeSnapshot('[Order] Order Details', '.order-table');
    });
});
