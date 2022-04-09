import AccountPageObject from "../../../support/pages/account.page-object";

const accountPage = new AccountPageObject();

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

describe('Wishlist: for wishlist page', { tags: ['@workflow', '@Wishlist'] }, () => {
    beforeEach(() => {
        cy.setToInitialState().then(() => {
            cy.setCookie('wishlist-enabled', '1');

            cy.authenticate().then((result) => {
                const requestConfig = {
                    headers: {
                        Authorization: `Bearer ${result.access}`
                    },
                    method: 'post',
                    url: `api/_action/system-config/batch`,
                    body: {
                        null: {
                            'core.cart.wishlistEnabled': true // enable wishlist
                        }
                    }
                };

                return cy.request(requestConfig);
            });

            return cy.createProductFixture(product)
        })
    });

    it('@workflow @wishlist: load wishlist page on guest state', () => {
        cy.intercept({
            method: 'POST',
            path: '/wishlist/guest-pagelet'
        }).as('guestPagelet');

        cy.visit('/');

        cy.window().then((win) => {
            win.localStorage.setItem('wishlist-' + win.salesChannelId, JSON.stringify({[product.id]: "20201220"}));
            cy.visit('/wishlist');

            cy.title().should('eq', 'Your wishlist');

            cy.wait('@guestPagelet').then(xhr => {
                expect(xhr.response).to.have.property('statusCode', 200);
            });

            cy.get('.cms-listing-row .cms-listing-col').contains(product.name);
            cy.get('.product-wishlist-form [type="submit"]').click();

            cy.wait('@guestPagelet').then(xhr => {
                expect(xhr.response).to.have.property('statusCode', 200);
                expect(win.localStorage.getItem('wishlist-' + win.salesChannelId)).to.equal(null)
            });

            cy.get('.cms-listing-row').find('h1').contains('Your wishlist is empty')
            cy.get('.cms-listing-row').find('p').contains('Keep an eye on products you like by adding them to your wishlist.');
        });
    });

    it('@workflow @wishlist: add to cart button work on guest page', () => {
        cy.intercept({
            url: '/wishlist/guest-pagelet',
            method: 'post'
        }).as('guestPagelet');

        cy.intercept({
            url: '/checkout/line-item/add',
            method: 'post'
        }).as('add-to-cart');

        cy.intercept({
            url: '/widgets/checkout/info',
            method: 'get'
        }).as('offcanvas');

        cy.visit('/');

        cy.window().then(win => {
            win.localStorage.setItem('wishlist-' + win.salesChannelId, JSON.stringify({[product.id]: "20201220"}));

            cy.visit('/wishlist');

            cy.title().should('eq', 'Your wishlist')

            cy.wait('@guestPagelet').then(xhr => {
                expect(xhr.response).to.have.property('statusCode', 200);
                cy.get('.cms-listing-row .cms-listing-col').contains(product.name);
                cy.get('.cms-listing-row .cms-listing-col .product-action .btn-buy').should('exist');
                cy.get('.cms-listing-row .cms-listing-col .product-action .btn-buy').click();

                cy.wait('@add-to-cart').then(xhr => {
                    expect(xhr.response).to.have.property('statusCode', 302);
                });

                cy.wait('@offcanvas').then(xhr => {
                    expect(xhr.response).to.have.property('statusCode', 200);
                    cy.get('.offcanvas.is-open.cart-offcanvas').should('exist');
                    cy.get('.offcanvas.is-open.cart-offcanvas').find('.cart-item-label').contains(product.name);

                    // Wishlist product should still exist
                    cy.get('.cms-listing-row .cms-listing-col').contains(product.name);
                });
            });
        });
    });

    it('@workflow @wishlist: remove product', () => {
        cy.createCustomerFixtureStorefront();

        cy.visit('/account/login');

        accountPage.login();

        cy.visit('/');
        cy.get('.product-wishlist-6dfd9dc216ab4ac99598b837ac600368').click()

        cy.visit('/wishlist');
        cy.get('.cms-listing-row .cms-listing-col').contains(product.name);
        cy.get('.product-wishlist-form [type="submit"]').click();
        cy.get('.alert-success').contains('You have successfully removed the product from your wishlist.');
    })
});
