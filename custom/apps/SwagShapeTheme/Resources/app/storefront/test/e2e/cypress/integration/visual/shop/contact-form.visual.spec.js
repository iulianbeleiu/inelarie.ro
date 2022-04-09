import ContactPageObject from "../../../support/pages/contact.page-object";

const contactPage = new ContactPageObject();

describe('Contact: Visual tests', () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
                cy.createProductFixture();
            })
            .then(() => {
                return cy.createCmsFixture();
            })
            .then(() => {
                return cy.loginViaApi();
            })
    });

    function createContactFormPage() {
        return cy.searchViaAdminApi({
            endpoint: 'sales-channel',
            data: {
                field: 'name',
                type: 'equals',
                value: 'Storefront'
            }
        }).then(() => {
            return cy.createDefaultFixture('cms-page', {}, 'cms-contact-page')
        }).then(() => {
            return cy.openInitialPage(`${Cypress.env('admin')}#/sw/category/index`);
        }).then(() => {
            return contactPage.assignContactFormToHomepage();
        })
    }

    it('@visual: see contact form', () => {
        createContactFormPage();

        cy.visit('/');

        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.intercept({
            path: '/form/contact',
            method: 'POST'
        }).as('contactFormPostRequest');

        cy.get('.cms-page .card-title').contains('Contact');

        contactPage.fillOutContactForm(contactPage.elements.formContact);

        cy.get(contactPage.elements.formContact).within(() => {
            cy.get(contactPage.elements.formContactButtonSubmit).scrollIntoView().click();
        });

        cy.wait('@contactFormPostRequest').then((xhr) => {
            expect(xhr.response.statusCode).to.eq(200);
        });

        cy.get('.cms-page').within(() => {
            cy.get('.confirm-message').contains('We have received your contact request and will process it as soon as possible.');
        });

        cy.takeSnapshot('[Contact] Contact form page submit', '.cms-page');
    });
});
