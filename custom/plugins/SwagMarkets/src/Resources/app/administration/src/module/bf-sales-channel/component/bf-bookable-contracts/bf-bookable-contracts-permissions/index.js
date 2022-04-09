import template from './bf-bookable-contracts-permissions.html.twig';

const {Component} = Shopware;

Component.register('bf-bookable-contracts-permissions', {
    template,

    methods: {
        closePermissionModal() {
            this.$emit('go-to-sub-processor', 'subProcessor');
        }
    }
})
