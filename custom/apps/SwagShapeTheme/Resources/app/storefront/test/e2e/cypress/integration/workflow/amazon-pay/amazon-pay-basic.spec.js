describe('AmazonPay: Basic view', { tags: ['@workflow', '@AmazonPay'] }, () => {
    beforeEach(() => {
        return cy.setToInitialState()
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
                // Set initial plugin config
                return cy.initializePluginConfig('amazon-config.json', `/api/_action/system-config?salesChannelId=${salesChannelData.id}`).then(() => {
                    return cy.patchViaAdminApi({
                        endpoint: `sales-channel/${salesChannelData.id}`,
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
            })
            .then(() => {
                cy.visit('/');
            });
    });

    it('@workflow @AmazonPay: should have an technical required amazon pay cookie', () => {
        cy.get('.js-cookie-configuration-button').click();
        cy.get('.offcanvas-cookie-entries > .icon-arrow-head-right').first().click();
        cy.get('.offcanvas-cookie-entry').contains('Amazon Pay')
    });

    it('@workflow @AmazonPay: should see logo in footer', () => {
        cy.get('.js-cookie-configuration-button').click();
        cy.get('.offcanvas .btn-primary').contains('Save').click();

        cy.get('.footer-logos img[alt="Amazon Pay"]')
            .scrollIntoView()
            .should('exist');

        cy.get('body').screenshot('logo-in-footer');
    });
});
