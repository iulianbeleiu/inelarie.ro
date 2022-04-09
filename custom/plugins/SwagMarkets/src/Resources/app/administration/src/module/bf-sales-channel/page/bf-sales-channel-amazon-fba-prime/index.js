import template from './bf-sales-channel-amazon-fba-prime.html.twig';

const {Component} = Shopware;

Component.override('bf-sales-channel-detail', {
    name: 'bf-sales-channel-amazon-fba-prime',

    template,

    inject: [
        'BfSalesChannelService',
    ],

    data() {
        return {
            clientExists:         false,
            clientInProgress:     false,
            isSalesChannelAmazon: false
        }
    },
    watch:   {
        salesChannelType() {
            Promise.resolve(this.salesChannelType).then((result) => {
                this.isSalesChannelAmazon = result === 'amazon';
            });
        }
    },
    created() {
        this.BfSalesChannelService.setSalesChannelId(this.$route.params.id);
        this.checkClientState();
    },
    methods: {
        checkClientState() {

            if (this.salesChannel !== null && this.salesChannel._isNew) {
                return;
            }

            this.BfSalesChannelService.checkClientState().then((response) => {
                this.clientExists = response.clientExists;
                this.clientInProgress = response.clientInProgress;
            })
        }
    }
});
