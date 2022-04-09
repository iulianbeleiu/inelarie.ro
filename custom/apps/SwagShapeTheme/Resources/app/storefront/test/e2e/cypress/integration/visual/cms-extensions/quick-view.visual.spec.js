let product = {};

describe('Quick View: Test if it works correctly', () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
                cy.createProductFixture();
            })
            .then((result) => {
                product = result;
            })
            .then(() => {
                cy.loginViaApi();
                cy.createCmsFixture();
            })
    });

    it('@visual @QuickView: Run Quick View in a product view directly in the listing page', () => {
        cy.openInitialPage(`${Cypress.env('admin')}#/sw/cms/index`);

        cy.intercept({
            method: 'POST',
            path: `${Cypress.env('apiPath')}/cms-page`,
        }).as('saveData');

        cy.intercept({
            method: 'PATCH',
            path: `${Cypress.env('apiPath')}/category/*`
        }).as('saveCategory');

        // Fill in basic data
        cy.contains('Create new layout').click();
        cy.get('.sw-cms-detail').should('be.visible');
        cy.contains('.sw-cms-create-wizard__page-type', 'Listing page').click();
        cy.get('.sw-cms-create-wizard__title').contains('Choose a section type to start with.');
        cy.contains('.sw-cms-stage-section-selection__default', 'Full width').click();
        cy.get('.sw-cms-create-wizard__title').contains('How do you want to label your new layout?');
        cy.contains('.sw-button--primary', 'Create layout').should('not.be.enabled');
        cy.get('#sw-field--page-name').typeAndCheck('Custom Full Listing Page');
        cy.contains('.sw-button--primary', 'Create layout').should('be.enabled');
        cy.contains('.sw-button--primary', 'Create layout').click();
        cy.get('.sw-loader').should('not.exist');
        cy.get('.sw-cms-block-product-listing').should('be.visible');

        cy.get('.sw-cms-block__config-overlay').invoke('show');
        cy.get('.sw-cms-block__config-overlay').should('be.visible');
        cy.get('.sw-cms-block__config-overlay').click();

        cy.get('.sw-cms-sidebar').should('be.visible');
        cy.get('.swag-cms-extensions-block-config-quickview .sw-sidebar-collapse__title')
            .should('be.visible')
            .click();
        cy.get('.swag-cms-extensions-block-config-quickview__active-switch').should('be.visible');
        cy.get('.swag-cms-extensions-block-config-quickview__active-switch [type="checkbox"]').check();

        // Save new page layout
        cy.get('.sw-cms-detail__save-action').click();
        cy.wait('@saveData').then(({ request, response }) => {
            expect(response.statusCode).to.eq(204);
        });

        // Assign layout to root category
        cy.visit(`${Cypress.env('admin')}#/sw/category/index`);
        cy.get('.sw-category-tree__inner .sw-tree-item__element').contains('Home').click();
        cy.get('.sw-category-detail__tab-cms').scrollIntoView().click();
        cy.get('.sw-card.sw-category-layout-card').scrollIntoView();
        cy.get('.sw-category-detail-layout__change-layout-action').click();
        cy.get('.sw-modal__dialog').should('be.visible');
        cy.get('.sw-cms-layout-modal__content-item--0 .sw-field--checkbox').click();
        cy.get('.sw-modal .sw-button--primary').click();
        cy.get('.sw-card.sw-category-layout-card .sw-category-layout-card__desc-headline').contains('Custom Full Listing Page');
        cy.get('.sw-category-detail__save-action').click();

        cy.wait('@saveCategory').then(({ request, response }) => {
            expect(response.statusCode).to.eq(204);
        });

        cy.visit('/');

        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.get('.cms-listing-row').should('be.visible');
        cy.get('.cms-listing-row > :nth-child(1) .product-name').last().click({ force: true });
        cy.get('.swag-cms-extensions-quickview-modal').should('be.visible');
        cy.get('.product-detail-name').should('be.visible');

        cy.get('[data-slide="prev"]').should('be.visible');
        cy.get('[data-slide="next"]').should('be.visible');

        cy.takeSnapshot('[QuickView] Display the QuickView', '.swag-cms-extensions-quickview-modal');
    });
})
