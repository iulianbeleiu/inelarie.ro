// / <reference types="Cypress" />

import ProductPageObject from '../../../support/pages/sw-product.page-object';

describe('Product: Base price', () => {
    before(() => {
        cy.setToInitialState()
            .then(() => cy.loginViaApi())
            .then(() => cy.createProductFixture())
            .then(() => cy.createDefaultFixture('unit'))
            .then(() => {
                cy.visit('/');
                cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
                cy.get('.offcanvas .btn-primary').contains('Save').click();
            })
            .then(() => cy.openInitialPage(`${Cypress.env('admin')}#/sw/product/index`));
    });

    it('@visual @detail: Editing product with base price', () => {
        const page = new ProductPageObject();

        // Request we want to wait for later
        cy.intercept({
            path: `**/api/_action/sync`,
            method: 'post'
        }).as('saveData');

        cy.clickContextMenuItem(
            '.sw-entity-listing__context-menu-edit-action',
            page.elements.contextMenuButton,
            `${page.elements.dataGridRow}--0`
        );

        // Set base price data
        cy.get('.sw-loader').should('not.exist');
        cy.get('.sw-product-detail__tab-specifications').scrollIntoView().click();
        cy.contains('.sw-card__title', 'Measures & packaging').scrollIntoView();
        cy.get('.sw-select-product__select_unit').typeSingleSelectAndCheck('Gramm', '.sw-select-product__select_unit');
        cy.get('.sw-product-packaging-form__purchase-unit-field').type('50');
        cy.get('.sw-product-packaging-form__pack-unit-field').type('Package');
        cy.get('.sw-product-packaging-form__pack-unit-plural-field').type('Packages');
        cy.get('.sw-product-packaging-form__reference-unit-field').type('100');

        // Save product
        cy.get(page.elements.productSaveAction).click();
        cy.wait('@saveData').then((xhr) => {
            expect(xhr.response).to.have.property('statusCode', 200);
        });

        // Verify in storefront
        cy.visit('/');

        cy.get('.product-price-unit').contains('Content: 50 Gramm (€128.00* / 100 Gramm)');

        cy.get('.product-name').click();
        cy.get('.product-detail-price-unit').contains('Content: 50 Gramm (€128.00* / 100 Gramm)');
        cy.get('.product-detail-price').contains('64.00');

        cy.takeSnapshot('[Product Detail] Base price', '.product-detail');
    });
});
