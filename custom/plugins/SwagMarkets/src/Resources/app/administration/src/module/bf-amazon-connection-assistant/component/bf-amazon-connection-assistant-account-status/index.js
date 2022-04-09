import template from './bf-amazon-connection-assistant-account-status.html.twig';
import './bf-amazon-connection-assistant-account-status.scss';

Shopware.Component.register('bf-amazon-connection-assistant-account-status', {
    template,
    inject: ['userService'],
    data() {
        return {
            user: {}
        }
    },
    created() {
        this.getUser();
    },
    methods: {
        getUser() {
            this.userService.getUser()
                .then(response => {
                    this.user = response.data;
                });
        }
    }
});
