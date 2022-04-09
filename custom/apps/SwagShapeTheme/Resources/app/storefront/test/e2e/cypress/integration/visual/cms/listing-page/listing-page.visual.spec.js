import CategoryPageObject from '../../../../support/pages/sw-category.page-object';

let product = {};

describe('CMS: Listing Page', { tags: ['@visual', '@cms'] }, () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
                cy.loginViaApi();
            })
            .then(() => {
                cy.createProductFixture();
            })
            .then((result) => {
                product = result;
                cy.openInitialPage(`${Cypress.env('admin')}#/sw/cms/index`);
            });
    });

    it('@base @cms: Create listing page', () => {
        const page = new CategoryPageObject();

        // Request we want to wait for later
        cy.intercept({
            method: 'POST',
            path: `${Cypress.env('apiPath')}/cms-page`
        }).as('saveDataCMSPage');
        cy.intercept({
            method: 'POST',
            path: `${Cypress.env('apiPath')}/category`
        }).as('saveDataCategory');
        cy.intercept({
            method: 'POST',
            path: `${Cypress.env('apiPath')}/search/category`
        }).as('loadCategory');
        cy.intercept({
            method: 'patch',
            path: `${Cypress.env('apiPath')}/category/**`
        }).as('editCategory');

        // Fill in basic data
        cy.contains('Create new layout').click();
        cy.get('.sw-cms-detail').should('be.visible');
        cy.contains('.sw-cms-create-wizard__page-type', 'Listing page').click();
        cy.get('.sw-cms-create-wizard__title').contains('Choose a section type to start with.');
        cy.contains('.sw-cms-stage-section-selection__default', 'Full width').click();
        cy.get('.sw-cms-create-wizard__title').contains('How do you want to label your new layout?');
        cy.contains('.sw-button--primary', 'Create layout').should('not.be.enabled');
        cy.get('#sw-field--page-name').typeAndCheck('CMS Listing Page');
        cy.contains('.sw-button--primary', 'Create layout').should('be.enabled');
        cy.contains('.sw-button--primary', 'Create layout').click();
        cy.get('.sw-loader').should('not.exist');
        cy.get('.sw-cms-block-product-listing').should('be.visible');

        // Add simple text block
        cy.get('.sw_sidebar__navigation-list li').eq(1).click();

        cy.get('.sw-cms-sidebar__block-preview')
            .first()
            .dragTo('.sw-cms-stage-add-block:first-child');
        cy.get('.sw-cms-block').should('be.visible');
        cy.get('.sw-text-editor__content-editor h2').contains('Lorem Ipsum dolor sit amet');

        cy.get('.sw-cms-slot:nth-of-type(1) .sw-text-editor__content-editor').clear();
        cy.get('.sw-cms-slot:nth-of-type(1) .sw-text-editor__content-editor').type('This is the listing page');

        cy.get('.sw-cms-detail__save-action').click();

        // Verify request is successful and contains listingPage
        cy.wait('@saveDataCMSPage').then(({ request, response }) => {
            expect(response.statusCode).to.eq(204);
        });

        cy.visit(`${Cypress.env('admin')}#/sw/category/index`)

        // Add category inside root one
        cy.get(`${page.elements.categoryTreeItemInner}__icon`).should('be.visible');
        cy.clickContextMenuItem(
            `${page.elements.categoryTreeItem}__sub-action`,
            page.elements.contextMenuButton,
            `${page.elements.categoryTreeItemInner}:nth-of-type(1)`
        );
        cy.get(`${page.elements.categoryTreeItemInner}__content input`).type('Listing Categorian');
        cy.get(`${page.elements.categoryTreeItemInner}__content input`).then(($btn) => {
            if ($btn) {
                cy.get(`${page.elements.categoryTreeItemInner}__content input`).should('be.visible');
                cy.get(`${page.elements.categoryTreeItemInner}__content input`).type('{enter}');
            }
        });

        cy.wait('@saveDataCategory').then(({ request, response }) => {
            expect(response.statusCode).to.eq(204);
        });

        cy.get('.sw-confirm-field__button-list').then((btn) => {
            if (btn.attr('style').includes('display: none;')) {
                cy.get('.sw-category-tree__inner .sw-tree-actions__headline').click();
            } else {
                cy.get('.sw-category-tree__inner .sw-confirm-field__button--cancel').click();
            }
        });
        cy.get(`${page.elements.categoryTreeItemInner}:nth-child(1)`).contains('Listing Categorian');
        cy.contains('Listing Categorian').click();

        // Assign category and set it active
        cy.wait('@loadCategory').then(({ request, response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('.sw-category-detail-base').should('be.visible');
        cy.get('input[name="categoryActive"]').click();

        cy.get('.sw-category-detail__tab-products').click();
        cy.get('.sw-entity-many-to-many-select .sw-field__label').contains('Products');
        cy.get('.sw-entity-many-to-many-select .sw-select__selection').should('be.visible').click();
        cy.get('.sw-entity-many-to-many-select .sw-select__selection input').type(product.name);
        cy.get('.sw-select-result-list__item-list li').contains(product.name).click();

        cy.get('.sw-category-detail__tab-cms').scrollIntoView().click();
        cy.get('.sw-card.sw-category-layout-card').scrollIntoView();
        cy.get('.sw-category-detail-layout__change-layout-action').click();
        cy.get('.sw-modal__dialog').should('be.visible');
        cy.get('.sw-cms-layout-modal__content-item--0 .sw-field--checkbox').click();
        cy.get('.sw-modal .sw-button--primary').click();
        cy.get('.sw-card.sw-category-layout-card .sw-category-layout-card__desc-headline').contains('CMS Listing Page');
        cy.get('.sw-category-detail__save-action').click();

        cy.get('.sw-category-detail__save-action').click();
        cy.wait('@editCategory').then(({ request, response }) => {
            expect(response.statusCode).to.eq(204);
        });

        // Verify on storefront
        cy.visit('/');
        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.get('.main-navigation-link-text').contains('Listing Categorian').click();
        cy.get('.cms-block h2').contains('This is the listing page');

        cy.takeSnapshot('[CMS] Listing Page', '.content-main');
    });
});
