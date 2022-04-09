import template from './bf-support.html.twig';

const { Component, Mixin } = Shopware;

Component.register('bf-support', {
    template,
    inject: [
        'repositoryFactory',
        'bfSupportService'
    ],
    mixins: [
        Mixin.getByName('notification'),
        Mixin.getByName('salutation')
    ],
    props: {
        showSupportModal: {
            type: Boolean,
            default: false
        },
        supportTitle: {
            type: String,
            default: ''
        },
        requestType: {
            type: String,
            default: ''
        },
        marketplace: {
            type: String,
            default: ''
        }
    },
    created() {
        this.prepareSupportTitle();
    },
    data() {
        return {
            isLoading: false,
            userForm: {
                salutationId: '',
                name: '',
                company: '',
                phoneNumber: '',
                email: '',
                message: '',
                requestAccept: false
            },
            errors: {}
        }
    },
    methods: {
        sendRequest() {
            this.isLoading = true;
            this.getErrorsVariables();

            let requestParams = this.userForm;

            requestParams.salesChannelId = this.$route.params.id;
            requestParams.requestSubject = this.supportTitle;
            requestParams.marketplace = this.marketplace;
            requestParams.requestType = this.requestType;
            requestParams.languageCode = localStorage.getItem('sw-admin-locale');

            this.bfSupportService.sendRequest(this.userForm)
                .then((response) => {
                    if (response && response.status === 201) {
                        this.$emit('closeSupportModal');

                        this.createNotificationSuccess({
                            title: this.$tc('bf-support.notification.success.title'),
                            message: this.$tc('bf-support.notification.success.message')
                        });
                    } else {
                        response.data.forEach((error, key) => {
                            let propertyName = error.propertyPath,
                                capitalizedProperty = propertyName.charAt(0).toUpperCase() + propertyName.slice(1);

                            this.errors['support' + capitalizedProperty + 'Error'] = this.getErrorCode(error);
                        });
                    }

                    this.isLoading = false;
                })
                .catch((errors) => {
                    this.createNotificationError({
                        title: this.$tc('bf-support.notification.error.title'),
                        message: this.$tc('bf-support.notification.error.message')
                    });

                    this.isLoading = false;
                });

        },
        getModalTitle() {
            let title = this.supportTitle;

            if (this.marketplace) {
                title += ' ' + this.marketplace;
            }

            return title;
        },
        getErrorCode(error) {
            return {
                code: error.code
            }
        },
        getErrorsVariables() {
            this.errors = {
                supportSalutationIdError: null,
                supportNameError: null,
                supportCompanyError: null,
                supportEmailError: null,
                supportPhoneNumberError: null,
                supportMessageError: null
            }
        },
        prepareSupportTitle() {
            if (this.supportTitle === '') {
                this.supportTitle = this.$tc('bf-support.modal.titleSupport');
            }
        }
    }
});
