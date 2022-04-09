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

describe('Wishlist: Merge wishlist', { tags: ['@workflow', '@Wishlist'] }, () => {
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
                                'core.cart.wishlistEnabled': true // enable wishlist
                            }
                        }
                    };

                    return cy.request(requestConfig);
                });

                cy.createCustomerFixtureStorefront()
                    .then(() => {
                        cy.createProductFixture(product)
                            .then(() => {
                                cy.setCookie('wishlist-enabled', '1');
                            });
                    })
            })
    });

    it('@workflow @wishlist: can be merge from anonymous user to registered users', () => {
        cy.visit('/');

        cy.intercept({
            path: '/wishlist/merge',
            method: 'post'
        }).as('wishlistMerge');

        // hover over product-box
        cy.get('.product-box').first().invoke('addClass', 'hover');

        let heartIcon = cy.get(`.product-wishlist-${product.id}`).first();
        heartIcon.should('be.visible');
        heartIcon.should('have.class', 'product-wishlist-not-added');
        heartIcon.get('.icon-wishlist-not-added').should('be.visible');
        heartIcon.should('not.have.class', 'product-wishlist-added');

        heartIcon.click();

        cy.window().then((win) => {
            cy.expect(win.wishlistEnabled).to.equal(1);
        });

        cy.visit('/account/login');

        // Login
        accountPage.login();

        cy.wait('@wishlistMerge').then(() => {
            cy.get('.flashbags .alert .alert-content-container .alert-content').contains('Your wishlist might contain products that have been added and saved during a previous visit.');
        });

        cy.visit('/');

        // hover over product-box
        cy.get('.product-box').first().invoke('addClass', 'hover');
        heartIcon = cy.get(`.product-wishlist-${product.id}`).first()

        heartIcon.should('have.class', 'product-wishlist-added');
        heartIcon.should('not.have.class', 'product-wishlist-not-added');
        heartIcon.get('.icon-wishlist-added').should('be.visible');
    });

    it('@workflow @wishlist: can be merge from anonymous user to registered users with same product', () => {
        cy.visit('/');

        cy.intercept({
            path: '/wishlist/add/**',
            method: 'post'
        }).as('wishlistAdd');

        cy.intercept({
            path: '/wishlist/merge',
            method: 'post'
        }).as('wishlistMerge');

        cy.visit('/account/login');
        accountPage.login();

        cy.visit('/');

        // hover over product-box
        cy.get('.product-box').first().invoke('addClass', 'hover');
        let heartIcon = cy.get(`.product-wishlist-${product.id}`).first();

        heartIcon.should('be.visible');
        heartIcon.should('have.class', 'product-wishlist-not-added');
        heartIcon.get('.icon-wishlist-not-added').should('be.visible');
        heartIcon.should('not.have.class', 'product-wishlist-added');

        heartIcon.click();

        cy.wait('@wishlistAdd').then(() => {
            cy.visit('/account/logout');
            cy.visit('/');
            cy.reload(true);
        });

        // hover over product-box
        cy.get('.product-box').first().invoke('addClass', 'hover');
        heartIcon = cy.get(`.product-wishlist-${product.id}`).first();

        heartIcon.click();

        // Login
        cy.visit('/account/login');
        accountPage.login();

        cy.wait('@wishlistMerge').then(() => {
            cy.get('.flashbags .alert .alert-content-container .alert-content').contains('Your wishlist might contain products that have been added and saved during a previous visit.');
        });
    });

    it('@workflow @wishlist: can be merge from anonymous user to registered users with different product', () => {
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
            path: '/wishlist/add/**',
            method: 'post'
        }).as('wishlistAdd');

        cy.intercept({
            url: '/wishlist/merge',
            method: 'post'
        }).as('wishlistMerge');

        cy.visit('/account/login');
        accountPage.login();

        cy.visit('/');

        // hover over product-box
        cy.get('.product-box').first().invoke('addClass', 'hover');
        let heartIcon = cy.get(`.product-wishlist-${product.id}`).first();

        heartIcon.should('be.visible');
        heartIcon.should('have.class', 'product-wishlist-not-added');

        heartIcon.click();

        cy.wait('@wishlistAdd').then(() => {
            cy.visit('/account/logout');
            cy.visit('/');
        });

        // hover over product-box
        cy.get('.cms-listing-col').next().then(el => {
            cy.wrap(el).get('.product-box').invoke('addClass', 'hover');
        })

        heartIcon = cy.get(`.product-wishlist-6dfd9dc216ab4ac99598b837ac600369`).first();
        heartIcon.should('be.visible');
        heartIcon.should('have.class', 'product-wishlist-not-added');

        heartIcon.click();

        // Login
        cy.visit('/account/login');
        accountPage.login();

        cy.wait('@wishlistMerge').then(() => {
            cy.get('.flashbags .alert .alert-content-container .alert-content').contains('Your wishlist might contain products that have been added and saved during a previous visit.');
        });
    });

    it('@workflow @wishlist: the order in which the products are displayed is based on the time they were added to the wishlist', () => {
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
            path: '/wishlist/add/**',
            method: 'post'
        }).as('wishlistAdd');

        cy.intercept({
            path: '/wishlist/merge',
            method: 'post'
        }).as('wishlistMerge');

        cy.visit('/account/login');
        accountPage.login();

        cy.visit('/');

        // hover over product-box
        cy.get('.product-box').first().invoke('addClass', 'hover');

        // add to wishlist with registered users
        let heartIcon = cy.get(`.product-wishlist-${product.id}`).first();
        heartIcon.should('be.visible');
        heartIcon.should('have.class', 'product-wishlist-not-added');

        heartIcon.click();

        cy.wait('@wishlistAdd').then(() => {
            cy.visit('/account/logout');
            cy.visit('/');
        });

        // hover over product-box
        cy.get('.cms-listing-col').next().then(el => {
            cy.wrap(el).get('.product-box').invoke('addClass', 'hover');
        })

        // add to wishlist with anonymous user
        heartIcon = cy.get(`.product-wishlist-6dfd9dc216ab4ac99598b837ac600369`).first();
        heartIcon.should('be.visible');
        heartIcon.should('have.class', 'product-wishlist-not-added');

        heartIcon.click();

        cy.visit('/account/login');
        accountPage.login();

        cy.visit('/wishlist');

        cy.wait('@wishlistMerge').then(() => {
            cy.visit('/wishlist');
            cy.get('.cms-listing-row').contains('Test product 1').should('be.visible');
            cy.get('.cms-listing-row').contains('Test product 2').should('be.visible');
        });
    });
});
