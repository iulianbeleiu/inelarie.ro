import AccountPageObject from "../../../support/pages/account.page-object";

const product = {
    "id": "6dfd9dc216ab4ac99598b837ac600368",
    "name": "Test product 1",
    "stock": 1,
    "productNumber": "RS-1",
    "descriptionLong": "Product description",
    "price": [
        {
            "currencyId": "b7d2554b0ce847cd82f3ac9bd1c0dfca",
            "net": 8.40,
            "linked": false,
            "gross": 10
        }
    ],
    "url": "/product-name.html",
    "manufacturer": {
        "id": "b7d2554b0ce847cd82f3ac9bd1c0dfca",
        "name": "Test variant manufacturer"
    },
};

const accountPage = new AccountPageObject();

describe('Wishlist: Check appearance of wishlist', () => {
    beforeEach(() => {
        cy.setToInitialState().then(() => {
            cy.authenticate().then((result) => {
                const requestConfig = {
                    headers: {
                        Authorization: `Bearer ${result.access}`
                    },
                    method: 'post',
                    url: `api/_action/system-config/batch`,
                    body: {
                        null: {
                            'core.cart.wishlistEnabled': true,
                            'core.listing.productsPerPage': 4
                        }
                    }
                };

                return cy.request(requestConfig);
            });
        })

        return cy.createCustomerFixtureStorefront()
            .then(() => {
                return cy.createProductFixture(product)
                    .then(() => {
                        cy.setCookie('wishlist-enabled', '1');
                    })
            })
    });

    it('@visual @wishlist: Wishlist empty page', () => {
        cy.visit('/wishlist');

        cy.get('.wishlist-listing-header').contains('Your wishlist is empty');
        cy.takeSnapshot('[Wishlist] Empty page', '.wishlist-page');
    })

    it('@visual @wishlist: Wishlist state is set correctly', () => {
        cy.visit('/');

        cy.window().then((win) => {
            expect(win.salesChannelId).to.not.empty;
            expect(win.customerLoggedInState).to.equal(0);
            expect(win.wishlistEnabled).to.equal(1);

            cy.visit('/account/login');

            // Login
            accountPage.login();

            cy.window().then((win) => {
                expect(win.customerLoggedInState).to.equal(1);
            });
        })
        cy.visit('/');

        cy.window().then((win) => {
            cy.get('.header-wishlist-icon svg').should('be.visible');
        })

        cy.takeSnapshot('[Wishlist] Home page with wishlist enable', 'body');
    });

    it('@visual @wishlist: See wishlist icon in product box', () => {
        cy.visit('/');

        // hover over product-box
        cy.get('.product-box').first().invoke('addClass', 'hover');

        let heartIcon = cy.get('.product-box .product-wishlist-action-circle').first();

        heartIcon.first().should('be.visible');
        heartIcon.first().should('have.class', 'product-wishlist-not-added');
        heartIcon.get('.icon-wishlist-not-added').should('be.visible');
        heartIcon.should('not.have.class', 'product-wishlist-added');

        cy.takeSnapshot('[Wishlist] Product box with wishlist icon', '.product-box');
    });

    it('@visual @wishlist: Heart icon badge display in product detail', () => {
        cy.visit('/');

        cy.get('.js-cookie-configuration-button .btn-primary').contains('Configure').click({force: true});
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.get('.product-box .product-name').click();

        cy.get('.product-wishlist-action').first().should('be.visible');

        cy.get('.product-wishlist-btn-content.text-wishlist-not-added').first().should('be.visible');
        cy.get('.product-wishlist-btn-content.text-wishlist-remove').first().should('not.be.visible');
        cy.get('.product-wishlist-btn-content.text-wishlist-not-added').first().contains('Add to wishlist');

        cy.get('.product-wishlist-action').first().click();

        cy.get('.product-wishlist-btn-content.text-wishlist-remove').first().should('be.visible');
        cy.get('.product-wishlist-btn-content.text-wishlist-not-added').first().should('not.be.visible');
        cy.get('.product-wishlist-btn-content.text-wishlist-remove').first().contains('Remove from wishlist');

        cy.takeSnapshot('[Wishlist] Product detail', '.product-detail');
    });
});
