describe('Product Detail: Check appearance of product property', () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => cy.fixture('product-properties.json'))
            .then((productProperties) => cy.createProductFixture(productProperties))
            .then(() => cy.createDefaultFixture('category'))
            .then(() => cy.visit('/'));
    });

    it('@visual @detail: verify product properties', () => {
        cy.visit('/ProductProperties/TEST');
        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.get('.product-detail-properties-table').should('be.visible');
        cy.get('.product-detail-properties-table').contains('Height')
        cy.get('.product-detail-properties-table').contains('Textile:')
        cy.get('.product-detail-properties-table').contains('Color')

        cy.takeSnapshot('[Product Detail] Properties', '.product-detail');
    });
});
