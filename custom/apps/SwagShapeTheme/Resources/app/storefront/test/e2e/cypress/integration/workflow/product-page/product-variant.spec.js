import ProductPageObject from "../../../support/pages/sw-product.page-object";

describe('Product Detail: Product variants', { tags: ['@workflow', '@ProductDetail'] }, () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => cy.loginViaApi())
            .then(() => cy.createProductVariantFixture())
            .then(() => cy.openInitialPage(`${Cypress.env('admin')}#/sw/product/index`));
    });

    it('@workflow @variants: add variant with surcharge to product', () => {
        const page = new ProductPageObject();

        // Request we want to wait for later
        cy.intercept({
            path: `${Cypress.env('apiPath')}/product/*`,
            method: 'patch'
        }).as('saveData');
        cy.intercept({
            path: `${Cypress.env('apiPath')}/search/property-group`,
            method: 'post'
        }).as('searchVariantGroup');
        cy.intercept({
            path: `/detail/**/switch?options=*`,
            method: 'get'
        }).as('changeVariant');

        // Navigate to variant generator listing and start
        cy.clickContextMenuItem(
            '.sw-entity-listing__context-menu-edit-action',
            page.elements.contextMenuButton,
            `${page.elements.dataGridRow}--0`
        );

        cy.get('.sw-product-detail__tab-variants').click();
        cy.get(page.elements.loader).should('not.exist');
        cy.get('.sw-product-variants-overview').should('be.visible');

        cy.get('.sw-data-grid__body').contains('Red');
        cy.get('.sw-data-grid__body').contains('Green');

        // Get green variant
        cy.get('.sw-loader').should('not.exist');
        cy.get('.sw-simple-search-field--form input').should('be.visible');

        cy.wait('@searchVariantGroup').then((xhr) => {
            expect(xhr.response).to.have.property('statusCode', 200);
            cy.get('.sw-simple-search-field--form input').type('Green');
        });
        cy.get('.sw-data-grid-skeleton').should('not.exist');
        cy.get('.sw-data-grid__row--1').should('not.exist');
        cy.get('.sw-data-grid__row--0 .sw-data-grid__cell--name').contains('Green');

        // Find variant to set surcharge on
        cy.get('.sw-data-grid__row--0 .sw-data-grid__cell--name').should('be.visible');
        cy.get('.sw-data-grid__row--0 .sw-price-preview').should('be.visible');
        cy.get('.sw-data-grid__row--0 .sw-data-grid__cell--name').dblclick({force: true});
        cy.get('.sw-data-grid__row--0 .sw-price-preview').should('not.exist');

        // Set surcharge
        cy.get('.is--inline-edit .sw-inheritance-switch').should('be.visible');
        cy.get('.sw-data-grid__row--0 #sw-price-field-gross').first().should('be.visible');
        cy.get('.sw-data-grid__row--0 #sw-price-field-gross').first().should('be.enabled');
        cy.get('.sw-data-grid__row--0 #sw-price-field-gross').first().should('have.value', '64');
        cy.get('.sw-data-grid__row--0 #sw-price-field-gross').first().clear();
        cy.get('.sw-data-grid__row--0 #sw-price-field-gross').first().should('have.value', '');
        cy.get('.sw-data-grid__row--0 #sw-price-field-gross').first().clearTypeAndCheck('100');
        cy.get('.sw-data-grid__row--0 #sw-price-field-gross').first().type('{enter}');

        // Assert surcharge
        cy.get('.sw-data-grid__row--0 #sw-price-field-net')
            .first()
            .invoke('val')
            .should('eq', '50.251256281407');
        cy.get('.icon--custom-uninherited').should('be.visible');
        cy.get('.sw-data-grid__inline-edit-save').click();

        // Validate product
        cy.wait('@saveData').then((xhr) => {
            expect(xhr.response).to.have.property('statusCode', 204);
            cy.awaitAndCheckNotification('Product "Green" has been saved.');
        });

        // Asign product to Home category
        cy.get('.sw-product-detail__tab-general').click();
        cy.get('.sw-product-detail-base__visibility-structure').scrollIntoView()

        cy.get('.sw-category-tree__input-field').focus();
        cy.get('.sw-category-tree-field__results').should('be.visible');
        cy.get('.sw-tree-item__element').contains('Home').parent().parent()
            .find('.sw-field__checkbox input')
            .click({force: true});
        cy.get('.sw-category-tree-field__selected-label').contains('Home').should('be.visible');
        cy.get('.sw-product-detail__save-action').click();

        // Find variant in Storefront
        cy.visit('/');
        cy.get('input[name=search]').first().type('Variant product name');
        cy.get('.search-suggest-container').should('be.visible');
        cy.get('.search-suggest-product-name')
            .contains('Variant product name')
            .click();

        // Verify in storefront
        cy.get('.product-detail-name').contains('Variant product name');
        cy.get('.product-detail-configurator-option-label').contains('Red')
        cy.get('.product-detail-configurator-option-label').contains('Green')
        cy.get('.product-detail-buy').should('be.visible');

        // Ensure that variant "Green" is checked at the moment the test runs
        cy.get('.product-detail-configurator-option-label[title="Green"]').then(($btn) => {
            const inputId = $btn.attr('for');

            cy.get(`#${inputId}`).then(($input) => {
                if (!$input.attr('checked')) {
                    cy.contains('Green').click();

                    cy.wait('@changeVariant').then((xhr) => {
                        expect(xhr.response).to.have.property('statusCode', 200);
                        cy.get('.product-detail-price').contains('100.00');
                    });
                } else {
                    cy.get('.product-detail-price').contains('100.00');
                }
            });
        });

        // Check usual price in "Red"
        cy.contains('Red').click();
        cy.wait('@changeVariant').then((xhr) => {
            expect(xhr.response).to.have.property('statusCode', 200);

            cy.get('.product-detail-price').contains('64.00');
        });
    });
});
