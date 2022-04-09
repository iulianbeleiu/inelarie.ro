describe('Product Detail: Check appearance of product review', () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => cy.createProductFixture())
            .then(() => cy.createCustomerFixtureStorefront())
            .then(() => {
                cy.visit('/Product-name/RS-333');
                cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
                cy.get('.offcanvas-cookie .btn-primary').contains('Save').click({force: true});
            })
    });

    it('@visual, @review: show review tab', () => {
        cy.get('#review-tab').click();
        cy.get('.product-detail-review-teaser-btn').should('be.visible');
        cy.get('.product-detail-review-list').contains('No reviews found');

        cy.takeSnapshot('[Product Detail] No review', '.product-detail-tabs');
    });

    it('@visual, @review: should be able to submit review', () => {
        const now = new Date(2020, 1,1).getTime();
        cy.clock(now);

        cy.get('#review-tab').click()
        cy.get('.product-detail-review-teaser button').click();
        cy.get('.product-detail-review-login').should('be.visible');
        cy.takeSnapshot('[Product Detail] Review Login', '.product-detail-tabs', {widths: [768, 1920]});

        cy.get('#loginMail').typeAndCheckStorefront('test@example.com');
        cy.get('#loginPassword').typeAndCheckStorefront('shopware');
        cy.get('.product-detail-review-login .btn-primary').click();

        cy.visit('/Product-name/RS-333');
        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas-cookie .btn-primary').contains('Save').click({force: true});

        cy.get('#review-tab').click();
        cy.get('.product-detail-review-teaser-btn').click();

        cy.get('#reviewTitle').type('Review title '.repeat(4));
        cy.get('#reviewContent').type('Review content '.repeat(10));
        cy.get('.product-detail-review-form-actions button').click();
        cy.get('.product-detail-review-list-content').should('be.visible');

        cy.changeElementStyling('.product-detail-review-item-date', 'visibility:hidden');
        cy.get('.product-detail-review-item-date')
            .should('have.css', 'visibility', 'hidden');

        cy.takeSnapshot('[Product Detail] Review post', '.product-detail-tabs', {widths: [768, 1920]});
    });

    it('@visual, @review: show review tab on the mobile', () => {
        cy.viewport('iphone-6');
        cy.get('#review-tab').click();
        cy.get('.product-detail-review-teaser-btn').should('be.visible');
        cy.get('.product-detail-review-list').contains('No reviews found');

        cy.takeSnapshot('[Product Detail] review tab on the mobile', '.product-detail-review', {widths: [375]});
    });
});
