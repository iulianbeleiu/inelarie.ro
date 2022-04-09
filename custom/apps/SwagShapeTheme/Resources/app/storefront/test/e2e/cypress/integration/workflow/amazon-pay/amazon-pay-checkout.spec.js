import CheckoutPageObject from '../../../support/pages/checkout.page-object';

const checkoutPage = new CheckoutPageObject();
// Filled in beforeEach hook for later usage
let salesChannelId;
let product;

describe('AmazonPay: Basic workflow', { tags: ['@workflow', '@AmazonPay'] }, () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => {
                cy.createProductFixture();
            })
            .then((result) => {
                product = result;
                cy.fixture('product.json').then((data) => {
                    // Preserve product id for later usage
                    product.id = data.id;
                });
            })
            .then(() => {
                // Search for storefront SalesChannel id
                return cy.searchViaAdminApi({
                    endpoint: 'sales-channel',
                    data: {
                        field: 'name',
                        value: 'Storefront'
                    }
                });
            })
            .then((salesChannelData) => {
                // Preserve salesChannelId for later use
                salesChannelId = salesChannelData.id;

                // Set initial plugin config
                return cy.initializePluginConfig('amazon-config.json', `/api/_action/system-config?salesChannelId=${salesChannelId}`).then(() => {
                    return cy.patchViaAdminApi({
                        endpoint: `sales-channel/${salesChannelId}`,
                        data: {
                            data: {
                                paymentMethodId: 'f7b88fc9c0104702a96f664dabfe2656',
                                paymentMethods: [
                                    {
                                        id: 'f7b88fc9c0104702a96f664dabfe2656'
                                    }
                                ]
                            }
                        }
                    });
                });
            });
    });

    describe('AmazonPay: Checkout register page', () => {
        it('@workflow @AmazonPay: should have amazon pay button in Checkout register page', () => {
            // Visit product detail page
            cy.visit(`/`);

            checkoutPage.search(product.name);
            cy.get('.search-suggest-product-name').contains(product.name).click();

            cy.get('body').screenshot('amazon-pay-button-in-product-detail--page');

            // Put product into cart
            cy.get('button.btn-buy').scrollIntoView().should('be.visible').click();

            cy.wait(1000);
            cy.get('body').screenshot('amazon-pay-button-in-offcanvas-cart');

            // Checkout
            cy.get('.offcanvas-cart-actions .btn-primary').click();

            cy.get('body').screenshot('amazon-pay-button-in-checkout-register-page');

            // AmazonPay button should be visible
            cy.get('#swag-amazon-pay-button-container-account-login')
                .shadow()
                .find('.amazonpay-button-container').should('be.visible');
        });

        it('@workflow @AmazonPay: should not have amazon pay button in Checkout register page when buttons are hidden globally', () => {
            // Update plugin configuration to hide one click checkout buttons
            cy.updatePluginConfig(
                {
                    key: 'hideOneClickCheckoutButtons',
                    value: true
                },
                salesChannelId
            ).then(() => {
                // Visit product detail page
                return cy.visit(`/`);
            });

            checkoutPage.search(product.name);
            cy.get('.search-suggest-product-name').contains(product.name).click();

            // Put product into cart
            cy.get('button.btn-buy').scrollIntoView().should('be.visible').click();

            // Checkout
            cy.get('.offcanvas-cart-actions .btn-primary').click();

            // AmazonPay button should not be visible
            cy.get('div.swag-amazon-pay-button-container.account-login').should('not.exist');
        });

        it('@workflow @AmazonPay: should not have amazon pay button in Checkout register page when setting is disabled', () => {
            // Update plugin configuration to not display button on checkout register page
            cy.updatePluginConfig(
                {
                    key: 'displayButtonOnCheckoutRegisterPage',
                    value: false
                },
                salesChannelId
            ).then(() => {
                // Visit product detail page
                return cy.visit(`/`);
            })

            checkoutPage.search(product.name);
            cy.get('.search-suggest-product-name').contains(product.name).click();

            // Put product into cart
            cy.get('button.btn-buy').scrollIntoView().should('be.visible').click();

            // Checkout
            cy.get('.offcanvas-cart-actions .btn-primary').click();

            // AmazonPay button should not be visible
            cy.get('div.swag-amazon-pay-button-container.account-login').should('not.exist');
        });
    });
});
