let product;

describe('Customize Product: Visual test customize product in German', { tags: ['@workflow', '@CustomizedProduct'] }, () => {

    beforeEach(() => {
        let salesChannelId = '';
        let languageId = '';
        let currencyId = '';
        let deDESnippetSetId = '';

        return cy.setToInitialState().then(() => {
            return cy.searchViaAdminApi({
                endpoint: 'sales-channel',
                data: {field: 'name', value: 'Storefront'}
            });
        })
            .then((salesChannel) => {
                salesChannelId = salesChannel.id;
                return cy.searchViaAdminApi({
                    endpoint: 'language',
                    data: {field: 'locale.code', value: 'de-DE'}
                });
            }).then((language) => {
                languageId = language.id;
                return cy.searchViaAdminApi({
                    endpoint: 'currency',
                    data: {field: 'isoCode', value: 'EUR'}
                });
            }).then((currency) => {
                currencyId = currency.id;
                return cy.searchViaAdminApi({
                    endpoint: 'snippet-set',
                    data: {field: 'iso', value: 'de-DE'}
                });
            }).then((snippetSet) => {
                deDESnippetSetId = snippetSet.id;
                return cy.createViaAdminApi({
                    endpoint: 'sales-channel-domain',
                    data: {
                        url: `${Cypress.config().baseUrl}/de`,
                        salesChannelId: salesChannelId,
                        languageId: languageId,
                        currencyId: currencyId,
                        snippetSetId: deDESnippetSetId
                    }
                });
            }).then(() => {
                return cy.createDefaultFixture(
                    'category',
                    {
                        translations: {
                            [languageId]: {
                                name: 'Mir doch egal'
                            }
                        }
                    },
                    'customized-product/price-detail-category'
                );
            })
            .then(() => cy.fixture('customized-product/product'))
            .then((fixtureProduct) => {
                product = fixtureProduct;

                // Now fetch the tax based on name
                return cy.searchViaAdminApi({
                    endpoint: 'tax',
                    data: {field: 'name', value: 'Standard rate'}
                });
            }).then((tax) => {
                // Add the tax id to the options and option values
                product.swagCustomizedProductsTemplate.options = product.swagCustomizedProductsTemplate.options
                    .map((value) => {
                        value.taxId = tax.id;
                        return value;
                    });
                // Create the product
                return cy.createCustomProductFixture(product, 'product', 'Price detail catalogue');
            })
            .then(() => cy.createCustomerFixtureStorefront())
            .then(() => cy.visit(`/de/detail/${product.id}`))
    });

    it('@visual @customized: should translate the price detail box to german', () => {
        // Verify we are on the correct product detail page, by checking the product name
        cy.get('.product-detail-name')
            .should('be.visible')
            .contains(product.name);

        // Check for the price box
        cy.get('.swag-customized-product__price-display').should('not.exist');
        cy.get('.swag-customized-product__price-display').should('be.exist');

        // Check the price box card titel
        cy.contains('.swag-customized-product__price-display > .card-body > .card-title', 'Pro-Stück-Aufschläge');

        // Check the product price label
        cy.contains('.price-display__product-price > .price-display__label', 'Produktpreis');

        // Check the summary label
        cy.contains('.price-display__summary > .price-display__label', 'Zwischensumme');

        // Check the total price label
        cy.contains('.price-display__total-price > .price-display__label', 'Gesamtpreis');
    });
});
