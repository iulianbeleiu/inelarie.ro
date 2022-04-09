import products from '../../../../fixtures/listing-pagination-products.json';

const testCases = [2, 4, 8];
const maximumCase = Math.max(...testCases);

describe('CMS: Listing Page', {tags: ['@workflow', '@cms']}, () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
                Array.from(products).forEach(product => cy.createProductFixture(product));
            })
    });

    testCases.forEach(testCase => {
        context(`Check pagination for ${testCase} products`, {tags: ['@workflow', '@cms']}, () => {
            beforeEach(() => {
                cy.loginViaApi().then(() => cy.visit('/admin#/sw/settings/listing/index'));
            });

            it('@base @cms: Run pagination', () => {
                cy.get('input[name="core.listing.productsPerPage"]').scrollIntoView().then(() => {
                    cy.get('input[name="core.listing.productsPerPage"]').clearTypeAndCheck(testCase.toString());
                });
                cy.get('label').eq(0).click();
                cy.get('.sw-settings-listing__save-action').click();
                cy.get('.icon--small-default-checkmark-line-medium').should('be.visible');
                cy.visit('/');

                cy.get('.cms-listing-row .card').should('have.length', testCase);

                const pageCount = maximumCase / testCase;
                if (pageCount === 1) {
                    cy.get('.cms-element-product-listing .pagination-nav').should('not.exist');
                } else {
                    cy.get('.pagination-nav .page-prev').should('have.class', 'disabled');
                    cy.get('.pagination-nav .page-next').should('not.have.class', 'disabled');

                    cy.get('.cms-element-product-listing .pagination-nav').should('have.length', 1);

                    for (let i = 1; i < pageCount; i++) {
                        cy.get('.pagination-nav .page-next').scrollIntoView().should('be.visible').click();
                        cy.get('.cms-listing-row .card').should('have.length', testCase);
                    }

                    cy.get('.pagination-nav .page-prev').should('have.class', 'disabled');
                    cy.get('.pagination-nav .page-next').should('not.have.class', 'disabled');
                }
            });

            it('@base @cms: Run pagination on search', () => {
                cy.get('input[name="core.listing.productsPerPage"]').scrollIntoView().then(() => {
                    cy.get('input[name="core.listing.productsPerPage"]').clearTypeAndCheck(testCase.toString());
                });
                cy.get('label').eq(0).click();
                cy.get('.sw-settings-listing__save-action').click();
                cy.get('.icon--small-default-checkmark-line-medium').should('be.visible');

                cy.visit('/');

                cy.get('#searchCollapse .header-search-input:visible').type('Test').type('{enter}');

                cy.get('.cms-listing-row .card').should('have.length', testCase);

                const pageCount = maximumCase / testCase;
                if (pageCount !== 1) {
                    cy.get('.pagination-nav .page-prev').should('have.class', 'disabled');
                    cy.get('.pagination-nav .page-next').should('not.have.class', 'disabled');

                    cy.get('.cms-element-product-listing .pagination-nav').should('have.length', 1);

                    for (let i = 1; i < pageCount; i++) {
                        cy.get('.pagination-nav .page-next').click();
                        cy.get('.cms-listing-row .card').should('have.length', testCase);
                    }

                    cy.get('.pagination-nav .page-prev').should('have.class', 'disabled');
                    cy.get('.pagination-nav .page-next').should('not.have.class', 'disabled');
                }
            });
        });
    });
});
