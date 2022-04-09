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

describe('Wishlist: Check appearance of wishlist', { tags: ['@workflow', '@Wishlist'] }, () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
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

        cy.createCustomerFixtureStorefront()
            .then(() => {
                return cy.createProductFixture(product)
                    .then(() => {
                        cy.setCookie('wishlist-enabled', '1');
                    })
            })
    });

    it('@workflow @wishlist: click add to wishlist icon redirect to login page if cookie is not accepted', () => {
        cy.visit('/');

        cy.window().then((win) => {
            cy.clearCookie('wishlist-enabled');

            cy.get('#wishlist-basket').should('not.be.visible');

            // hover over product-box
            cy.get('.product-box').first().invoke('addClass', 'hover');
            cy.get('.product-box .product-wishlist-action-circle').first().click();

            cy.get('.login-card').should('be.visible');
            cy.url().should('include', '/account/login?redirectTo=frontend.wishlist.add.after.login');

            cy.get('#loginMail').typeAndCheckStorefront('test@example.com');
            cy.get('#loginPassword').typeAndCheckStorefront('shopware');
            cy.get('.login-submit [type="submit"]').click();

            cy.get('.flashbags').should('be.visible');
            cy.get('.flashbags .alert-success').should('be.visible');

            cy.get('.alert-content').contains('You have successfully added the product to your wishlist.')
        })
    });

    it('@workflow @wishlist: order in which the products are displayed is based on the time they were added to the wishlist', () => {
        cy.createProductFixture({
            "id": "6dfd9dc216ab4ac99598b837ac600369",
            "name": "Test product 2",
            "stock": 1,
            "productNumber": "RS-2",
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
        });

        cy.visit('/');

        cy.intercept({
            path: '/wishlist/guest-pagelet',
            method: 'post'
        }).as('guestPagelet');

        // hover over product-box
        cy.get('.product-box').first().invoke('addClass', 'hover');

        let heartIcon = cy.get(`.product-wishlist-${product.id}`).first();
        heartIcon.should('be.visible');
        heartIcon.should('have.class', 'product-wishlist-not-added');

        heartIcon.click();

        // hover over product-box
        cy.get('.cms-listing-col').next().then(el => {
            cy.wrap(el).get('.product-box').invoke('addClass', 'hover');
        })

        heartIcon = cy.get(`.product-wishlist-6dfd9dc216ab4ac99598b837ac600369`).first();
        heartIcon.should('be.visible');
        heartIcon.should('have.class', 'product-wishlist-not-added');

        heartIcon.click();

        cy.visit('/wishlist');
        cy.title().should('eq', 'Your wishlist');

        cy.wait('@guestPagelet').then(xhr => {
            expect(xhr.response).to.have.property('statusCode', 200);

            cy.get('.cms-listing-col').eq(0).contains('Test product 2');
            cy.get('.cms-listing-col').eq(1).contains(product.name);
        });
    });
})
