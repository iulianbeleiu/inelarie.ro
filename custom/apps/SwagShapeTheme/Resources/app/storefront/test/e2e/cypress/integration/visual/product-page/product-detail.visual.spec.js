import ProductStreamObject from '../../../support/pages/sw-product-stream.page-object';

describe('Product Detail: Product', () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => cy.createProductFixture())
            .then(() => cy.createDefaultFixture('product-stream', {}, 'product-stream-active'))
            .then(() => {
                return cy.createPropertyFixture({options: [{name: 'Red'}]});
            })
            .then(() => cy.loginViaApi())
            .then(() => cy.openInitialPage(`${Cypress.env('admin')}#/sw/product/index`));
    });

    it('@visual @detail: check appearance of product cross selling workflow', () => {
        const page = new ProductStreamObject();

        // Request we want to wait for later
        cy.intercept({
            path: `${Cypress.env('apiPath')}/_action/sync`,
            method: 'post'
        }).as('saveData');

        cy.intercept({
            path: `${Cypress.env('apiPath')}/search/product-stream`,
            method: 'post'
        }).as('saveStream');

        cy.createProductFixture({
            name: 'Original product',
            productNumber: 'RS-11111',
            description: 'Pudding wafer apple pie fruitcake cupcake.'
        })
            .then(() => {
                return cy.createProductFixture({
                    name: 'Second product',
                    productNumber: 'RS-22222',
                    description: 'Jelly beans jelly-o toffee I love jelly pie tart cupcake topping.'
                });
            })
            .then(() => {
                return cy.createProductFixture({
                    name: 'Third product',
                    productNumber: 'RS-33333',
                    description: 'Cookie bonbon tootsie roll lemon drops soufflé powder gummies bonbon.'
                });
            });

        // Open product and add cross selling
        cy.visit(`${Cypress.env('admin')}#/sw/product/index`);
        cy.get('.sw-product-list-grid').should('be.visible');

        cy.contains('Original product').click();
        cy.get('.sw-product-detail__tab-cross-selling').click();
        cy.get(page.elements.loader).should('not.exist');

        cy.contains(
            `${page.elements.ghostButton}`,
            'Add new Cross Selling'
        ).should('be.visible').click();
        cy.get('.product-detail-cross-selling-form').should('be.visible');

        // Fill in cross selling form
        cy.get('#sw-field--crossSelling-name').typeAndCheck('Kunden kauften auch');
        cy.get('#sw-field--crossSelling-product-group')
            .typeSingleSelectAndCheck(
                '2nd Product stream',
                '#sw-field--crossSelling-product-group'
            );
        cy.get('input[name="sw-field--crossSelling-active"]').click();

        // Save and verify cross selling stream
        cy.get('.sw-button-process').click();
        cy.wait('@saveData').then((xhr) => {
            expect(xhr.response).to.have.property('statusCode', 200);
        });

        // Verify in storefront
        cy.visit('/');
        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.get('.header-search-input').first().type('Original product');
        cy.get('.search-suggest-container').should('be.visible');
        cy.get('.search-suggest-product-name')
            .contains('Original product')
            .click();

        cy.get('.product-cross-selling-tab-navigation')
            .scrollIntoView()
            .should('be.visible');
        cy.get('.product-detail-tab-navigation-link.active').contains('Kunden kauften auch');
        cy.takeSnapshot('[Product detail] Cross Selling', '.product-detail-cross-selling');
    });
})
