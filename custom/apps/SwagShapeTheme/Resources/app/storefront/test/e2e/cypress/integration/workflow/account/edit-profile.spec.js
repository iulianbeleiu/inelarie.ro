import AccountPageObject from '../../../support/pages/account.page-object';

const accountPage = new AccountPageObject();

describe('Account: Profile', { tags: ['@workflow', '@profile'] }, () => {
    beforeEach(() => {
        return cy.setToInitialState()
            .then(() => {
                return cy.createCustomerFixtureStorefront()
            })
    });

    it('@workflow @profile: update profile', () => {
        cy.visit('/');
        cy.authenticate().then((result) => {
            const requestConfig = {
                headers: {
                    Authorization: `Bearer ${result.access}`
                },
                method: 'post',
                url: `api/_action/system-config/batch`,
                body: {
                    null: {
                        'core.loginRegistration.showAccountTypeSelection': true
                    }
                }
            };
            return cy.request(requestConfig);
        });

        cy.visit('/account/login');
        accountPage.login();

        cy.get('.account-welcome h1').contains('Hello');

        cy.get('.card-actions [href="/account/profile"]').click();

        const accountTypeSelector = 'select[name="accountType"]';
        const companySelector = 'input[name="company"]';

        cy.get(accountTypeSelector).should('be.visible');

        cy.get(accountTypeSelector).select('Private');
        cy.get(companySelector).should('not.be.visible');

        cy.get(accountTypeSelector).select('Commercial');
        cy.get(companySelector).should('be.visible');
        cy.get(companySelector).type('Company Testing');

        cy.get('#profilePersonalForm button[type="submit"]').click();
        cy.get('.alert-success .alert-content').contains('Profile has been updated.');

        cy.get('a[href="#profile-email-form"]').click();
        cy.get('#profile-email-form').should('have.class', 'show');
        cy.get('#profile-password-form').should('not.have.class', 'show');

        cy.get('#personalMail').type('test2@example.com');
        cy.get('#personalMailConfirmation').type('test2@example.com');
        cy.get('#personalMailPasswordCurrent').type('shopware');

        cy.get('#profileMailForm').find('.profile-form-submit').click();
        cy.get('.alert-success .alert-content').contains('Your email address has been updated.');

        cy.get('a[href="#profile-password-form"]').click();
        cy.get('#profile-password-form').should('have.class', 'show');
        cy.get('#profile-email-form').should('not.have.class', 'show');
        cy.get('#newPassword').type('shopware1');
        cy.get('#passwordConfirmation').type('shopware1');
        cy.get('#password').type('shopware');

        cy.get('#profilePasswordForm').find('.profile-form-submit').click();
        cy.get('.alert-success .alert-content').contains('Your password has been updated.');
    });

    it('@workflow @profile: delete account', () => {
        cy.intercept({
            method: 'POST',
            path: '/account/profile/delete'
        }).as('deleteRequest');

        cy.visit('/');

        // allow customer deletion via rest API
        cy.authenticate().then((result) => {
            const requestConfig = {
                headers: {
                    Authorization: `Bearer ${result.access}`
                },
                method: 'post',
                url: `api/_action/system-config/batch`,
                body: {
                    null: {
                        'core.loginRegistration.allowCustomerDeletion': true
                    }
                }
            };
            return cy.request(requestConfig);
        });

        cy.visit('/account/login');
        accountPage.login();

        cy.get('.card-actions [href="/account/profile"]').click();
        cy.get('a[href="#confirmDeleteAccountModal"]').click();

        cy.wait(1000);

        cy.get('#confirmDeleteAccountModal button[type="submit"]').click();
        cy.wait('@deleteRequest').then((xhr) => {
            expect(xhr.response.statusCode).to.eq(302);
        });
    })
});
