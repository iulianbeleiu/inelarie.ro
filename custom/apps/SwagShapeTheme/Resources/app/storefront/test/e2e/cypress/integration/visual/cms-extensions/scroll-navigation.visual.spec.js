import CategoryPageObject from '../../../support/pages/sw-category.page-object';

let product = {};

describe('Scroll Navigation: Test if it works correctly', () => {
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
                cy.createCmsFixture();
            })
    });

    it('@visual @ScrollNavigation: Run Scroll Navigation', () => {
        const page = new CategoryPageObject();

        cy.openInitialPage(`${Cypress.env('admin')}#/sw/cms/index`);

        cy.intercept({
            method: 'POST',
            path: `${Cypress.env('apiPath')}/category`
        }).as('saveDataCategory');

        cy.intercept({
            method: 'POST',
            path: `${Cypress.env('apiPath')}/search/category`
        }).as('loadCategory');

        cy.intercept({
            method: 'POST',
            path: `${Cypress.env('apiPath')}/cms-page`
        }).as('saveData');

        cy.intercept({
            method: 'PATCH',
            url: `${Cypress.env('apiPath')}/category/*`
        }).as('saveCategory');

        // Fill in basic data of new layout page
        cy.contains('Create new layout').click();
        cy.get('.sw-cms-detail').should('be.visible');
        cy.contains('.sw-cms-create-wizard__page-type', 'Listing page').click();
        cy.get('.sw-cms-create-wizard__title').contains('Choose a section type to start with.');
        cy.contains('.sw-cms-stage-section-selection__default', 'Full width').click();
        cy.get('.sw-cms-create-wizard__title').contains('How do you want to label your new layout?');
        cy.contains('.sw-button--primary', 'Create layout').should('not.be.enabled');
        cy.get('#sw-field--page-name').typeAndCheck('Custom Full Scroll Navigation Listing Page');
        cy.contains('.sw-button--primary', 'Create layout').should('be.enabled');
        cy.contains('.sw-button--primary', 'Create layout').click();
        cy.get('.sw-loader').should('not.exist');
        cy.get('.sw-cms-block-product-listing').should('be.visible');

        // Turn on Scrooll Navigation in default commerce
        cy.get('.sw-cms-section').first()
            .find('.sw-cms-section__action').first().click();
        cy.get('input[name="sw-field--swagCmsExtensionsScrollNavigation-active"]').check();
        cy.get('input[name="sw-field--swagCmsExtensionsScrollNavigation-displayName"]').should('be.visible').type('Commerce Test');

        // Add a cms section with scroll navigation
        cy.get('.sw-cms-stage-add-section').last().find('.sw-cms-stage-add-section__button').click();
        cy.get('.sw-cms-stage-section-selection__default')
            .contains('Full width')
            .find('.sw-cms-stage-section-selection__default-preview').click();
        cy.wait(1000);
        cy.get('.sw-cms-section').last()
            .find('.sw-cms-section__action').first().click();
        cy.get('input[name="sw-field--swagCmsExtensionsScrollNavigation-active"]').check();
        cy.get('input[name="sw-field--swagCmsExtensionsScrollNavigation-displayName"]').should('be.visible').type('Lorem ipsum Test');

        // Add simple text block
        cy.get('.sw-cms-sidebar').should('be.visible');
        cy.get('.sw_sidebar__navigation-list button[title="Blocks"]').should('be.visible').click();
        cy.get('select[name="sw-field--currentBlockCategory"]').should('be.visible').select('Text');
        cy.get('.sw-cms-sidebar__block-preview')
            .first()
            .dragTo('.sw-cms-section__empty-stage');
        cy.get('.sw-cms-block').should('be.visible');
        cy.get('.sw-text-editor__content-editor h2').contains('Lorem Ipsum dolor sit amet');

        // Save new page layout
        cy.get('.sw-cms-detail__save-action').click();
        cy.wait('@saveData').then(({ request, response }) => {
            expect(response.statusCode).to.eq(204);
        });

        // Assign layout to root category
        cy.visit(`${Cypress.env('admin')}#/sw/category/index`);

        // Add category inside root one
        cy.get(`${page.elements.categoryTreeItemInner}__icon`).should('be.visible');
        cy.clickContextMenuItem(
            `${page.elements.categoryTreeItem}__sub-action`,
            page.elements.contextMenuButton,
            `${page.elements.categoryTreeItemInner}:nth-of-type(1)`
        );
        cy.get(`${page.elements.categoryTreeItemInner}__content input`).type('Scroll Navigation Categorian');
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
        cy.get(`${page.elements.categoryTreeItemInner}:nth-child(1)`).contains('Scroll Navigation Categorian');
        cy.contains('Scroll Navigation Categorian').click();

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
        cy.get('.sw-card.sw-category-layout-card .sw-category-layout-card__desc-headline').contains('Custom Full Scroll Navigation Listing Page');
        cy.get('.sw-category-detail__save-action').click();

        cy.wait('@saveCategory').then(({ request, response }) => {
            expect(response.statusCode).to.eq(204);
        });

        cy.visit('/');
        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.get('.main-navigation-menu .main-navigation-link[title="Scroll Navigation Categorian"]').should('be.visible').click();

        cy.get('.scroll-navigation-sidebar').should('be.visible');
        cy.get('.scroll-navigation-sidebar-entry').last().click().should('have.class', 'scroll-navigation-sidebar-entry--active');
        cy.get('.scroll-navigation-sidebar-entry-label').should('not.be.visible').contains('Lorem ipsum Test');

        // Check in mobile mode
        cy.viewport('ipad-2');
        cy.get('.scroll-navigation-sidebar-mobile-menu')
            .scrollIntoView()
            .should('be.visible')
            .find('.scroll-navigation-menu-toggle').should('be.visible').click();
        cy.get('.scroll-navigation-sidebar').should('be.visible');
        cy.takeSnapshot('[Scroll Navigation] Display list of entries', '.scroll-navigation-sidebar');
    });
})
