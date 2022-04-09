import template from './bf-plugin-configuration.html.twig';

import './bf-plugin-configuration.scss';

const {Component, Mixin} = Shopware;

Component.register('bf-plugin-configuration', {
    template,
    inject: [
        'bfPluginConfigurationService'
    ],
    mixins: [
        Mixin.getByName('notification')
    ],
    props: {
        isLoading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            currentLocale: 'en'
        }
    },
    computed: {},
    methods: {
        repairIntegrationUser() {
            this.isLoading = true;

            this.bfPluginConfigurationService.repairIntegrationUser()
                .then(() => {
                    this.isLoading = false;
                    this.createNotificationSuccess({
                        title: this.$tc('bf-plugin-configuration.integration.dialogue.successTitle'),
                        message: this.$tc('bf-plugin-configuration.integration.dialogue.successMessage')
                    });
                })
                .catch((error) => {
                    this.isLoading = false;
                    this.createNotificationError({
                        title: this.$tc('bf-plugin-configuration.integration.dialogue.errorTitle'),
                        message: this.$tc('bf-plugin-configuration.integration.dialogue.errorMessage')
                    });
                });
        }
    }
});
