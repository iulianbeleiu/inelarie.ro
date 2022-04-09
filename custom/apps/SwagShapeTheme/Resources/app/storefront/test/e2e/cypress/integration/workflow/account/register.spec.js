import AccountPageObject from '../../../support/pages/account.page-object';

const accountPage = new AccountPageObject();

describe('Account: Register via account menu', {tags: ['@workflow', '@register']}, () => {
    beforeEach(() => {
        return cy.setToInitialState()
    })

    it('@workflow @register: trigger validation error', () => {
        cy.visit('/');

        cy.get('.account-menu [type="button"]').click();
        cy.get('.account-menu-dropdown').should('be.visible');

        cy.get('.account-menu-register').children('a').click();
        cy.get(accountPage.elements.registerCard).should('be.visible');

        cy.get('[name="email"]:invalid').should('be.visible');
        cy.get(`${accountPage.elements.registerSubmit} [type="submit"]`).click();
    });

    it('@workflow @register: fill registration form and submit', () => {
        cy.visit('/account/login');

        cy.get(accountPage.elements.registerCard).should('be.visible');

        cy.get('#personalSalutation').select('Mr.');
        cy.get('input[name="firstName"]').type('John');
        cy.get('input[name="lastName"]').type('Doe');

        cy.get('#personalMail').type('john-doe-for-testing@example.com');
        cy.get(`${accountPage.elements.registerForm} input[name="password"]`).type('1234567890');

        cy.get('input[name="billingAddress[street]"]').type('123 Main St');
        cy.get('input[name="billingAddress[zipcode]"]').type('9876');
        cy.get('input[name="billingAddress[city]"]').type('Anytown');

        cy.get('select[name="billingAddress[countryId]"]').select('USA');
        cy.get('select[name="billingAddress[countryStateId]"').should('be.visible');

        cy.get('select[name="billingAddress[countryStateId]"]').select('Ohio');
        cy.get(`${accountPage.elements.registerSubmit} [type="submit"]`).click();

        cy.url().should('not.include', '/register');
        cy.url().should('include', '/account');

        cy.get('.account-welcome h1').contains('Hello');
    });

    it('@workflow @register: registration as commercial user', () => {
        cy.authenticate()
            .then((result) => {
                const requestConfig = {
                    headers: {
                        Authorization: `Bearer ${result.access}`
                    },
                    method: 'post',
                    url: `api/_action/system-config/batch`,
                    body: {
                        null: {
                            'core.loginRegistration.showAccountTypeSelection': true,
                            'core.loginRegistration.showTitleField': true,
                            'core.loginRegistration.requireEmailConfirmation': true,
                            'core.loginRegistration.doubleOptInRegistration': true,
                            'core.loginRegistration.requirePasswordConfirmation': true,
                            'core.loginRegistration.showPhoneNumberField': true,
                            'core.loginRegistration.phoneNumberFieldRequired': true,
                            'core.loginRegistration.showBirthdayField': true,
                            'core.loginRegistration.birthdayFieldRequired': true,
                            'core.loginRegistration.showAdditionalAddressField1': true,
                            'core.loginRegistration.additionalAddressField1Required': true,
                            'core.loginRegistration.showAdditionalAddressField2': true,
                            'core.loginRegistration.additionalAddressField2Required': true,
                            'core.loginRegistration.requireDataProtectionCheckbox': true,
                        }
                    }
                };
                return cy.request(requestConfig);
            });

        cy.visit('/account/login');
        cy.get(accountPage.elements.registerCard).should('be.visible');

        const accountTypeSelector = 'select[name="accountType"]';
        const accountTypeSelectorForDifferentAddress = 'select[name="shippingAddress[accountType]"]';

        cy.get(accountTypeSelector).should('be.visible');

        cy.get(accountTypeSelector).select('Commercial');
        cy.get('select[name="salutationId"]').select('Mr.');
        cy.get('input[name="title"]').type('Master');
        cy.get('input[name="firstName"]').type('John');
        cy.get('input[name="lastName"]').type('Doe');
        cy.get('select[name="birthdayDay"]').select('1');
        cy.get('select[name="birthdayMonth"]').select('1');
        cy.get('select[name="birthdayYear"]').select('2001');

        cy.get('#billingAddresscompany').type('Company ABC');
        cy.get('#billingAddressdepartment').type('ABC Department');
        cy.get('#vatIds').type('1234567');
        cy.get('#personalMail').type('testvat@gmail.com');
        cy.get('#personalMailConfirmation').type('testvat@gmail.com');
        cy.get('#personalPassword').type('password@123456');
        cy.get('#personalPasswordConfirmation').type('password@123456');
        cy.get('#billingAddressAddressCountry').select('Germany');
        cy.get('#billingAddressAddressCountryState').select('Berlin');

        cy.get('#billingAddressAddressStreet').type('ABC Ansgarstr 4');
        cy.get('#billingAddressAddressZipcode').type('49134');
        cy.get('#billingAddressAddressCity').type('Wallenhorst');
        cy.get('#billingAddressAddressCity').type('Wallenhorst');
        cy.get('#billingAddressAdditionalField1').type('DEF Ansgarstr 2');
        cy.get('#billingAddressAdditionalField2').type('GHK Ansgarstr 3');
        cy.get('#billingAddressAddressPhoneNumber').type('0123456789');

        cy.get('input[name="acceptedDataProtection"]').should('not.be.visible')
            .check({force: true})
            .should('be.checked');

        cy.get(`${accountPage.elements.registerSubmit} [type="submit"]`).click();

        cy.get('.alert').should('have.class', 'alert-success');
    });
});
