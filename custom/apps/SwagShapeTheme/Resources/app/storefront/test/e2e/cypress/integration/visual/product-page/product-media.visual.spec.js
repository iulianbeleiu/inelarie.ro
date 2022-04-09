import ProductPageObject from "../../../support/pages/sw-product.page-object";

const waitImageSlideTime = 500;

describe('Product Detail: Product media', () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
                cy.loginViaApi();
            })
            .then(() => {
                cy.createProductFixture();
            })
            .then(() => cy.fixture('product'));
    });

    it('@visual @detail: check appearance of basic product media workflow', () => {
        const page = new ProductPageObject();

        cy.visit(`${Cypress.env('admin')}#/sw/product/index`);

        // Request we want to wait for later
        cy.intercept({
            path: `**/api/_action/sync`,
            method: 'post'
        }).as('saveProduct');

        // Open product
        cy.clickContextMenuItem(
            '.sw-entity-listing__context-menu-edit-action',
            page.elements.contextMenuButton,
            `${page.elements.dataGridRow}--0`
        );

        // Add first image to product
        cy.get('.sw-product-media-form__previews').scrollIntoView();
        cy.get('#files').attachFile(
            'img/sw-product-preview.png',
            {
                fileName: 'sw-product-preview.jpg',
                mimeType: 'image/jpg',
                subjectType: 'input'
            }
        );
        cy.get('.sw-product-image__image img')
            .should('have.attr', 'src')
            .and('match', /sw-product-preview/);
        cy.awaitAndCheckNotification('File has been saved.');

        // Save product
        cy.get(page.elements.productSaveAction).click();
        cy.wait('@saveProduct').then((xhr) => {
            expect(xhr.response).to.have.property('statusCode', 200);
        });

        // Verify in storefront
        cy.visit('/');
        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.get('.product-name').click();
        cy.get('.gallery-slider-single-image > .img-fluid').should('be.visible');
        cy.get('.gallery-slider-single-image > .img-fluid')
            .should('have.attr', 'src')
            .and('match', /sw-product-preview/);

        // Take snapshot for visual testing
        cy.takeSnapshot('[Product Detail] Product image', '.gallery-slider-single-image > .img-fluid');
    });

    it('@visual, @image: Product image slide area', () => {
        const page = new ProductPageObject();

        cy.visit(`${Cypress.env('admin')}#/sw/product/index`);

        // Request we want to wait for later
        cy.intercept({
            path: `${Cypress.env('apiPath')}/_action/sync`,
            method: 'post'
        }).as('saveData');

        // Open product
        cy.clickContextMenuItem(
            '.sw-entity-listing__context-menu-edit-action',
            page.elements.contextMenuButton,
            `${page.elements.dataGridRow}--0`
        );

        // Upload Image
        for (let i = 0; i < 5; i++) {
            cy.get('.sw-product-media-form__previews').scrollIntoView();
            cy.get('#files').attachFile(
                `img/sw-product-preview-${i}.png`,
                {
                    fileName: `sw-product-preview-${i}.png`,
                    mimeType: 'image/jpg',
                    subjectType: 'input'
                }
            );
            cy.get('.sw-product-image__image img')
                .should('have.attr', 'src')
                .and('match', /sw-product-preview/);
            cy.awaitAndCheckNotification('File has been saved.');
        }

        // Save product
        cy.get(page.elements.productSaveAction).click();
        cy.wait('@saveData').then((xhr) => {
            expect(xhr.response).to.have.property('statusCode', 200);
        });
        cy.get('.sw-loader').should('not.exist');

        // Verify in storefront
        cy.visit('/Product-name/RS-333');
        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.get('.gallery-slider-controls-next').first().click();
        cy.wait(waitImageSlideTime);
        cy.get('.gallery-slider-controls .gallery-slider-controls-next').first().should('be.visible').click();
        cy.wait(waitImageSlideTime);
        cy.get('.gallery-slider-container .gallery-slider-item-container').eq(3).should('have.class', 'tns-slide-active');

        cy.get('.gallery-slider-controls .gallery-slider-controls-prev').should('be.visible');
        cy.takeSnapshot('[Product Detail] Product image gallery slide', '.product-detail-media .gallery-slider');

        cy.get('.gallery-slider .tns-slide-active').click();
        cy.get('.image-zoom-container').should('be.visible');
        cy.wait(waitImageSlideTime);
        cy.takeSnapshot('[Product Detail] Product image zoom container', '.image-zoom-container');
    });
});
