import template from './bf-sales-channel-amazon-extended-configuration.html.twig';
import BfSalesChannelService from "../../../../service/bf-sales-channel.service";

const {Component} = Shopware;
Component.register('bf-sales-channel-amazon-extended-configuration', {
    template,
    inject: ['BfSalesChannelService'],
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
        isSalesChannelAmazon: false
    },
    data() {
        return {
            dangerousGoods: [{label: 'Ghs', value: 'ghs'}, {label: 'Storage', value: 'storage'}, {
                label: 'Waste',
                value: 'waste'
            },
                {label: 'Not applicable', value: 'not_applicable'}, {label: 'Transportation', value: 'transportation'},
                {label: 'Other', value: 'other'}, {label: 'Unknown', value: 'unknown'}],
            dangerousGoodsItem: '',
            needsBattery: [{label: this.$tc('global.yes'), value: '1'}, {label: this.$tc('global.no'), value: '0'}],
            needsBatteryItem: '',
            enableFba: false,
            isLoading: true
        }
    },
    watch: {
        salesChannel: function (newSalesChannel, oldSalesChannel) {
            if (oldSalesChannel === null && newSalesChannel !== null && this.$route.meta.$module.getSalesChannelByTypeId(newSalesChannel.typeId) === 'amazon') {
                this.loadComponent();
            }
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
    methods: {
        async loadComponent() {
            await this.BfSalesChannelService.getShopsConfigurations().then((response) => {
                if (response.status === 200 && response.data.success === true) {
                    let data = response.data.data;
                    if (data.hasOwnProperty('AMAZON_ARE_BATTERIES_REQUIRED')) {
                        this.needsBatteryItem = data.AMAZON_ARE_BATTERIES_REQUIRED;
                    }

                    if (data.hasOwnProperty('AMAZON_DANGEROUS_GOODS_DEFAULT')) {
                        this.dangerousGoodsItem = data.AMAZON_DANGEROUS_GOODS_DEFAULT;
                    }
                }

                this.enableFba = this.salesChannel.enableFba;
                this.salesChannel.needsBatteryItem = this.needsBatteryItem;
                this.salesChannel.dangerousGoodsItem = this.dangerousGoodsItem;
            });

            this.isLoading = false;
        },
        changedBattery(args) {
            this.needsBatteryItem = args;
            this.salesChannel.needsBatteryItem = this.needsBatteryItem;
        },
        changedDangerousGoods(args) {
            this.dangerousGoodsItem = args;
            this.salesChannel.dangerousGoodsItem = this.dangerousGoodsItem;
        },
        changedEnableFba(args) {
            this.enableFba = args;
            this.salesChannel.enableFba = this.enableFba;
        }
    },
    created() {
        if (this.salesChannel !== null && this.salesChannel._isNew) { return; }

        this.loadComponent();
    },
    beforeCreate() {
        this.isLoading = true;
    }
});
