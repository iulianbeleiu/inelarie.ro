import CategoryPageObject from '../../../support/pages/sw-category.page-object';

describe('Shop page: CMS service page', () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => cy.loginViaApi())
            .then(() => {
                cy.createDefaultFixture('category',{}, 'footer-category-first');
            })
            .then(() => {
                cy.createDefaultFixture('category',{}, 'footer-category-second');
            })
            .then(() => {
                cy.searchViaAdminApi({
                    endpoint: 'sales-channel',
                    data: {
                        field: 'name',
                        value: 'Storefront'
                    }
                });
            })
            .then((salesChannel) => {
                // This ID of the fixture is set by purpose, thus being predictable
                cy.fixture('footer-category-first').then((category) => {
                    cy.updateViaAdminApi('sales-channel', salesChannel.id, {
                        data: {
                            footerCategoryId: category.id,
                            maintenanceIpWhitelist: []
                        }
                    });
                })
            });
    });

    function assignToFooterLink() {
        const page = new CategoryPageObject();

        cy.visit(`${Cypress.env('admin')}#/sw/category/index`);

        cy.intercept({
            url: `${Cypress.env('apiPath')}/search/category`,
            method: 'POST'
        }).as('saveData');

        cy.get('.sw-empty-state__title').contains('No category selected');
        cy.get(`${page.elements.categoryTreeItem}__icon`).should('be.visible');

        cy.get('.sw-category-tree__inner .sw-tree-item__element').contains('Footer').click();
        cy.get('a[href="#/sw/category/index/24c3c853a8354db89d04ce3a06dc5bbc"]').contains('Information').parents('.sw-tree-item__children').find('.sw-context-button__button').click();

        // Create a category
        cy.get('.sw-tree-item__sub-action')
            .contains('New subcategory')
            .click();
        cy.get('#sw-field--draft').type('Shipping and payment');
        cy.get('.sw-confirm-field__button.sw-button--primary').click();
        cy.get('.sw-tree-item__children .tree-link')
            .contains('Shipping and payment')
            .click();

        cy.get('.sw-card__title').contains('General').should('be.visible');
        cy.get('input[name="categoryActive"]').click();

        // Edit the layout
        cy.get('.sw-category-detail__tab-cms').click();
        cy.get('.sw-card__title').contains('Layout assignment').should('be.visible');
        cy.get('.sw-category-detail-layout__change-layout-action').click();
        cy.get('.sw-modal__dialog').should('be.visible');

        cy.get('.sw-cms-layout-modal__content-item--0 .sw-field--checkbox').click();
        cy.get('.sw-modal .sw-button--primary').click();
        cy.get('.sw-card.sw-category-layout-card .sw-category-layout-card__desc-headline').contains('Shipping and payment');

        // Save the category
        cy.get('.sw-category-detail__save-action').click();

        // Wait for category request with correct data to be successful
        cy.wait('@saveData').its('response.statusCode').should('equal', 200);
    }

    function createServicePage() {
        let salesChannel;

        return cy.searchViaAdminApi({
            endpoint: 'sales-channel',
            data: {
                field: 'name',
                type: 'equals',
                value: 'Storefront'
            }
        }).then((data) => {
            salesChannel = data.id;
            cy.createDefaultFixture('cms-page', {}, 'cms-service-page')
        }).then(() => {
            cy.openInitialPage(`${Cypress.env('admin')}#/sw/category/index`);
            assignToFooterLink();
        });
    }

    it('@visual: see service page in the footer', () => {
        createServicePage();
        cy.visit('/');

        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.get('.footer-link-item').should('be.visible');
        cy.get('.footer-link-item').contains('Shipping and payment');
        cy.get('a.footer-link').should('have.attr', 'href')
            .and('include', '/Information/Shipping-and-payment');

        cy.takeSnapshot('[CMS] service link in the footer', '.footer-main');

        cy.get('.footer-link').contains('Shipping and payment').click();

        cy.get('.cms-element-text').should('be.visible');
        cy.get('.cms-element-text').contains('Shipping and payment');
        cy.get('.breadcrumb-link.is-active').should('have.attr', 'href')
            .and('include', '/Information/Shipping-and-payment');

        cy.takeSnapshot('[CMS] Service and information page', '.cms-page');
    });
});
