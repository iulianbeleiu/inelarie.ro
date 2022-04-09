import MediaPageObject from '../../../../support/pages/sw-media.page-object';

let images = ['sw-product-preview', 'sw-product-preview-0', 'sw-landing-page'];

describe('CMS: Landing Page', { tags: ['@workflow', '@cms'] }, () => {
    beforeEach(() => {
        let salesChannel;
        cy.setToInitialState()
            .then(() => {
                cy.loginViaApi()
            })
            .then(() => {
                return cy.searchViaAdminApi({
                    endpoint: 'sales-channel',
                    data: {
                        field: 'name',
                        type: 'equals',
                        value: 'Storefront'
                    }
                });
            })
            .then((data) => {
                salesChannel = data.id;
                return cy.createCmsFixture();
            })
            .then((page) => {
                page.name = 'Testing page';
                page.type = 'landingpage';

                return cy.createDefaultFixture('landing-page', {
                    cmsPage: page,
                    salesChannels: [{id: salesChannel}]
                });
            })
            .then(() => {
                cy.visit(`${Cypress.env('admin')}#/sw/cms/index`);
            });
    });

    it('@workflow @cms: basic landing page', () => {
        const page = new MediaPageObject();

        cy.intercept({
            method: 'patch',
            path: `${Cypress.env('apiPath')}/cms-page/*`,
        }).as('saveData');

        cy.get('.sw-cms-list-item--0').should('be.visible');
        //
        cy.get('.sw-cms-list-item--0').click();
        cy.get('.sw-cms-section__empty-stage').should('be.visible');

        // Add simple text block
        cy.get('.sw_sidebar__navigation-list li').eq(1).click();

        cy.get('.sw-cms-sidebar__block-preview')
            .first()
            .dragTo('.sw-cms-section__empty-stage');
        cy.get('.sw-cms-block').should('be.visible');
        cy.get('.sw-text-editor__content-editor h2').contains('Lorem Ipsum dolor sit amet');

        cy.get('.sw-cms-slot:nth-of-type(1) .sw-text-editor__content-editor').clear();
        cy.get('.sw-cms-slot:nth-of-type(1) .sw-text-editor__content-editor').type('This is the landing page');

        // Add three slider images
        cy.get('#sw-field--currentBlockCategory').select('Images');

        cy.get('.sw-cms-sidebar__block-selection > div:nth-of-type(10)').scrollIntoView();
        cy.get('.sw-cms-sidebar__block-selection > div:nth-of-type(10)')
            .dragTo('.sw-cms-stage-add-block:last-child');
        cy.get('.sw-cms-block').should('be.visible');
        cy.get('.sw-cms-block__config-overlay').last().invoke('show');
        cy.get('.sw-cms-block__config-overlay').last().should('be.visible');
        cy.get('.sw-cms-block__config-overlay').last().click();
        cy.get('.sw-cms-block__config-overlay.is--active').last().should('be.visible');
        cy.get('.sw-cms-slot .sw-cms-slot__overlay').invoke('show');
        cy.get('.sw-cms-slot .sw-cms-slot__settings-action').click();
        cy.get('.sw-cms-slot__config-modal').should('be.visible');

        images.forEach(image => {
            cy.get(`.sw-cms-slot__config-modal ${page.elements.uploadInput}`)
                .attachFile({
                    filePath: `img/${image}.png`,
                    fileName: `${image}.png`,
                    mimeType: 'image/png'
                });
            cy.get(`.sw-media-preview-v2__item[alt="${image}"]`).should('be.visible');
            cy.get('body')
                .then(($body) => {
                    if ($body.find('.sw-modal__footer').length === 2) {
                        cy.get('.sw-modal__footer .sw-button--primary').last().click();
                    }
                });
        })

        cy.awaitAndCheckNotification('File has been saved.');
        cy.get('.sw-modal__footer .sw-button--primary').click();

        // Save the layout
        cy.get('.sw-cms-detail__save-action').click();

        // Verify request is successful and contains landingPages
        cy.wait('@saveData').then(({ request, response }) => {
            expect(response.statusCode).to.eq(204);
        });

        // Verify layout in ShowRoom Theme
        cy.visit('/landingpage');
        cy.get('.is-ctl-landingpage').should('be.visible');
        cy.get('.cms-block h2').contains('This is the landing page');

        images.forEach((image, index) => {
            cy.get(`#tns1-item${index} .image-slider-image`)
                .should('be.visible')
                .and('have.attr', 'src')
                .and('include', image);

            if(index !== 2) {
                cy.get('.icon-arrow-head-right').click();
            }
        });
    });
})
