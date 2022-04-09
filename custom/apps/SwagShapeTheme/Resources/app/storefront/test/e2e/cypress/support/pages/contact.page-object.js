export default class ContactPageObject {
    constructor() {
        this.elements = {
            footerLinkContact: '.footer-contact-form a[data-toggle="modal"]',
            formContactModal: '.modal form[action="/form/contact"]',
            formContact: '.cms-page form[action="/form/contact"]',
            formContactSalutation: '#form-Salutation',
            formContactFirstName: '#form-firstName',
            formContactLastName: '#form-lastName',
            formContactMail: '#form-email',
            formContactPhone: '#form-phone',
            formContactSubject: '#form-subject',
            formContactComment: '#form-comment',
            formContactDataProtectionCheckbox: '.privacy-notice input[type="checkbox"]',
            formContactButtonSubmit: 'button[type="submit"]',
            modalButtonDismiss: 'button[data-dismiss="modal"]'
        }
    }

    fillOutContactForm(el) {
        cy.get(el).within(() => {
            cy.get(this.elements.formContactSalutation).select('Not specified');
            cy.get(this.elements.formContactFirstName).type('Foo');
            cy.get(this.elements.formContactLastName).type('Bar');
            cy.get(this.elements.formContactMail).type('user@example.com');
            cy.get(this.elements.formContactPhone).type('+123456789');
            cy.get(this.elements.formContactSubject).type('Lorem ipsum');
            cy.get(this.elements.formContactComment).type('Dolor sit amet.');
        });
    }

    assignContactFormToHomepage() {
        cy.intercept({
            path: `${Cypress.env('apiPath')}/category/*`,
            method: 'patch'
        }).as('saveCategory');

        cy.get('.sw-category-tree__inner .sw-tree-item__element').contains('Home').click();
        cy.get('.sw-category-detail__tab-cms').click();
        cy.get('.sw-card.sw-category-layout-card').scrollIntoView();
        cy.get('.sw-category-detail-layout__change-layout-action').click();
        cy.get('.sw-modal__dialog').should('be.visible');

        cy.get('.sw-cms-layout-modal__content-item--0 .sw-field--checkbox').click();
        cy.get('.sw-modal .sw-button--primary').click();
        cy.get('.sw-card.sw-category-layout-card .sw-category-layout-card__desc-headline').contains('Test Contact Form Page');

        // Save layout
        cy.get('.sw-category-detail__save-action').click();
        cy.wait('@saveCategory').then((xhr) => {
            expect(xhr.response.statusCode).to.eq(204);
        });
    }
}
