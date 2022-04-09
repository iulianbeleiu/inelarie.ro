import products from '../../../../fixtures/listing-pagination-products.json';

const testCases = [8];

describe('CMS: Listing Page', {tags: ['@visual', '@cms']}, () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
                Array.from(products).forEach(product => cy.createProductFixture(product));
            });
    });

    testCases.forEach(testCase => {
        context(`Check pagination for ${testCase} products`, () => {
            beforeEach(() => {
                cy.loginViaApi().then(() => cy.visit('/admin#/sw/settings/listing/index'));
            });

            it('@base @cms: Run pagination', () => {
                cy.get('input[name="core.listing.productsPerPage"]')
                    .scrollIntoView()
                    .then(() => {
                        cy.get('input[name="core.listing.productsPerPage"]')
                            .clearTypeAndCheck(testCase.toString());
                    });
                cy.get('label').eq(0).click();
                cy.get('.sw-settings-listing__save-action').click();
                cy.get('.icon--small-default-checkmark-line-medium').should('be.visible');

                cy.visit('/');
                cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
                cy.get('.offcanvas .btn-primary').contains('Save').click();

                cy.intercept({
                    method: 'GET',
                    path: '/widgets/cms/navigation/**'
                }).as('loadNextPage');

                cy.get('.cms-listing-row .card').should('have.length', testCase);

                cy.takeSnapshot('[CMS] Listing Page with Pagination', '.content-main');
            });
        });
    });
});
