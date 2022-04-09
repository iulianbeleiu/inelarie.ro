import CheckoutPageObject from '../../../support/pages/checkout.page-object';
import AccountPageObject from '../../../support/pages/account.page-object';

const additionalProducts = [{
    name: '19% Product',
    taxName: 'Standard rate',
    productNumber: 'RS-1919',
}, {
    name: '7% Product',
    taxName: 'Reduced rate',
    productNumber: 'RS-777',
}, {
    name: 'Mixed Products',
    taxName: 'Reduced rate',
    productNumber: 'RS-719719',
}];

let product = {};

describe('Checkout: Use different taxes in products while checkout',  {tags: ['@workflow', '@checkout']}, () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => {
                return cy.createProductFixture()
            })
            .then(() => {
                return cy.createDefaultFixture('category')
            })
            .then(() => {
                return cy.fixture('product');
            })
            .then((result) => {
                product = result;
                return cy.createCustomerFixtureStorefront()
            })
            .then(() => {
                cy.visit('/');
            })
    });

    additionalProducts.forEach(additionalProduct => {
        const contextDescription = additionalProduct.productNumber === "RS-777" ?
            `tax ${additionalProduct.taxName}, 2x same product` : `taxes: ${additionalProduct.taxName} & 19%`;

        context(`Checkout with ${additionalProduct.name} (${contextDescription})`, () => {
            beforeEach(() => {
                return cy.createProductFixture(additionalProduct).then(() => {
                    cy.visit('/');
                })
            });

            it('@workflow @checkout: Run checkout', () => {
                const checkoutPage = new CheckoutPageObject();
                const accountPage = new AccountPageObject();
                let productName = product.name;

                const taxSum = additionalProduct.name === '7% Product' ? 4.185 : 10.22;
                const additionalTaxSum = additionalProduct.name === 'Mixed Products' ? 4.19 : taxSum;

                if (additionalProduct.productNumber === "RS-777") {
                    productName = additionalProduct.name;
                }

                // search product
                checkoutPage.search(productName);

                cy.contains('.search-suggest-product-name', productName).click();
                cy.get('.product-detail-buy .btn-buy').click();

                // Off canvas
                cy.get(`${checkoutPage.elements.offCanvasCart}.is-open`).should('be.visible');
                cy.get(`${checkoutPage.elements.cartItem}-label`).contains(productName);
                cy.get(`${checkoutPage.elements.offCanvasCart} .offcanvas-close`).click();

                // search product
                checkoutPage.search(additionalProduct.name);

                cy.contains('.search-suggest-product-name', additionalProduct.name).click();
                cy.get('.product-detail-buy .btn-buy').click();

                // Off canvas
                cy.get(`${checkoutPage.elements.offCanvasCart}.is-open`).should('be.visible');
                cy.get(`${checkoutPage.elements.cartItem}-label`).contains(additionalProduct.name);

                // Checkout
                cy.get('.offcanvas-cart-actions .btn-primary').click();

                // Login
                cy.get('.checkout-main').should('be.visible');
                accountPage.getLoginCollapse().click();
                accountPage.login();

                // Confirm
                cy.get('.confirm-tos .custom-checkbox label').scrollIntoView();
                cy.get('.confirm-tos .custom-checkbox label').click(1, 1);
                cy.get('.confirm-address').contains('Pep Eroni');

                cy.get(`${checkoutPage.elements.cartItem}-details-container ${checkoutPage.elements.cartItem}-label`)
                    .contains(additionalProduct.name);

                // We need to look at the calculation separately, for each test case
                if (additionalProduct.name === '7% Product') {
                    // 2x same products of 7% tax
                    cy.get(':nth-child(2) > :nth-child(1) .cart-item-total-price')
                        .contains(`${product.price[0].gross * 2}`);
                    cy.get('.checkout-aside-summary-value:last-child').contains(`${taxSum * 2}`);
                } else if (additionalProduct.name === 'Mixed Products') {
                    // 2 separate product of differing taxes (e.g. 19% and 7%)
                    cy.get(`${checkoutPage.elements.cartItem}-details-container ${checkoutPage.elements.cartItem}-label`)
                        .contains(productName);

                    cy.get(':nth-child(2) > :nth-child(1) .cart-item-total-price')
                        .contains(product.price[0].gross);

                    cy.get(':nth-child(3) > :nth-child(1) .cart-item-total-price')
                        .contains(product.price[0].gross);
                    cy.get('.checkout-aside-summary-value:nth-of-type(5)').contains(taxSum);
                    cy.get('.checkout-aside-summary-value:last-child').contains(additionalTaxSum);
                } else {
                    // 2 separate products of same tax (e.g. 19%)
                    cy.get(`${checkoutPage.elements.cartItem}-details-container ${checkoutPage.elements.cartItem}-label`)
                        .contains(productName);

                    cy.get(':nth-child(2) > :nth-child(1) .cart-item-total-price')
                        .contains(product.price[0].gross);

                    cy.get(':nth-child(3) > :nth-child(1) .cart-item-total-price')
                        .contains(product.price[0].gross);
                    cy.get('.checkout-aside-summary-value:last-child').contains(`${taxSum * 2}`);
                }
                cy.get('.checkout-aside-summary-total').contains(`${product.price[0].gross * 2}`);

                // Finish checkout
                cy.get('#confirmFormSubmit').scrollIntoView();
                cy.get('#confirmFormSubmit').click();
                cy.get('.finish-header').contains('Thank you for your order with Demostore!');

                // Let's check the calculation on /finish as well
                cy.contains(additionalProduct.name);

                if (additionalProduct.name === '7% Product') {
                    // 2x same products of 7% tax

                    cy.get(':nth-child(2) > :nth-child(1) .cart-item-total-price')
                        .contains(`${product.price[0].gross * 2}`);
                    cy.get('.checkout-aside-summary-value:last-child').contains(`${taxSum * 2}`);
                } else if (additionalProduct.name === 'Mixed Products') {
                    // 2 separate product of differing taxes (e.g. 19% and 7%)
                    cy.contains(productName);
                    cy.get(':nth-child(2) > :nth-child(1) .cart-item-total-price')
                        .contains(product.price[0].gross);
                    cy.get('.checkout-aside-summary-value:nth-of-type(5)').contains(taxSum);
                    cy.get('.checkout-aside-summary-value:last-child').contains(additionalTaxSum);
                } else {
                    // 2 separate products of same tax (e.g. 19%)
                    cy.contains(productName);

                    cy.get(':nth-child(2) > :nth-child(1) .cart-item-total-price')
                        .contains(product.price[0].gross);
                    cy.get(':nth-child(3) > :nth-child(1) .cart-item-total-price')
                        .contains(product.price[0].gross);
                    cy.get('.checkout-aside-summary-value:last-child').contains(`${taxSum * 2}`);
                }
            });
        });
    });
});
