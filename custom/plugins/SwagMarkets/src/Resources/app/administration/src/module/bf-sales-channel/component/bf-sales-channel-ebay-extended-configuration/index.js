import template from './bf-sales-channel-ebay-extended-configuration.html.twig';

const {Component} = Shopware;

Component.register('bf-sales-channel-ebay-extended-configuration', {
    template,
    props: {
        clientExists: {
            type: Boolean,
            required: true
        },
        clientInProgress: {
            type: Boolean,
            required: true
        },
        currentContractName: {
            type: String,
            default: ''
        },
        salesChannel: null,
        isSalesChannelEbay: false
    },
    data() {
        return {
            isLoading: true
        }
    },
    computed: {
        isDisabled() {
            return !this.clientExists
                || this.clientInProgress
                || this.currentContractName === ''
                || this.currentContractName === 'SwagMarketsStarter';
        }
    },
    created() {
        if (this.salesChannel !== null) {
            this.isLoading = false;
        }
    },
    beforeCreate() {
        this.isLoading = true;
    }
});
