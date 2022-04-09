import template from './bf-sales-channel-amazon-fba-prime-shipping-methods.html.twig';

const {Component} = Shopware;
Component.register('bf-sales-channel-amazon-fba-prime-shipping-methods', {
    template,
    inject: [
        'BfSalesChannelService'
    ],
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
        isSalesChannelAmazon: false,
        salesChannel: null
    },
    data() {
        return {
            isLoading: true,
            shippingMethods: [],
            amazonFbaPrimeShippingMethods: {
                fba: {shippingMethodId: null, code: ""},
                prime: {shippingMethodId: null, code: ""},
                primeNextDay: {shippingMethodId: null, code: ""},
                primeSecondDay: {shippingMethodId: null, code: ""}
            }
        }
    },
    watch: {
        salesChannel: function (salesChannel, oldSalesChannel) {
            if (oldSalesChannel === null && salesChannel !== null && this.$route.meta.$module.getSalesChannelByTypeId(salesChannel.typeId) === 'amazon') {
                this.loadComponent();
            }
        },
        'salesChannel.shippingMethods': function (newShippingMethods, oldShippingMethods) {
            if (newShippingMethods !== null && oldShippingMethods !== null && newShippingMethods !== undefined && oldShippingMethods !== undefined) {
                if (oldShippingMethods.getIds().length !== newShippingMethods.getIds().length) {
                    this.loadComponent();
                }
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
        changedItem(args, propName) {
            let shippingMethodEntity = this.salesChannel.shippingMethods.get(args[0]);

            if (shippingMethodEntity !== null && shippingMethodEntity !== undefined) {
                this.salesChannel.amazonFbaPrimeShippingMethods[propName] = {
                    name: shippingMethodEntity.name,
                    shippingMethodId: shippingMethodEntity.id,
                    code: shippingMethodEntity.name + ' ##' + shippingMethodEntity.id + '##'
                };
            }
        },
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        async loadComponent() {
            let me = this,
                config = await this.BfSalesChannelService.getBfConfigSwagMarketsSystem(),
                salesChannelShippingData = this.salesChannel.shippingMethods.get(this.salesChannel.shippingMethodId);
            await this.sleep(1500);

            this.shippingMethods = [];

            if (this.salesChannel.shippingMethods.getIds().length > 0) {
                this.salesChannel.shippingMethods.getIds().forEach(function (item) {
                    let shippingItem = me.salesChannel.shippingMethods.get(item);
                    me.shippingMethods.push(
                        {
                            label: shippingItem.name,
                            value: shippingItem.id,
                            disabled: false
                        }
                    )
                });
            }

            this.amazonFbaPrimeShippingMethods = config.amazonFbaPrimeShippingMethods;

            if(salesChannelShippingData !== null) {
                this.setDefaultShippingData(salesChannelShippingData);
            }

            this.salesChannel.amazonFbaPrimeShippingMethods = this.amazonFbaPrimeShippingMethods;
            this.isLoading = false;
        },
        setDefaultShippingData(salesChannelShippingData) {
            let defaultShippingMethodsId = salesChannelShippingData.id,
                defaultShippingMethodsCode = salesChannelShippingData.name + " ##" + salesChannelShippingData.id + "##";
            if (this.amazonFbaPrimeShippingMethods.fba.shippingMethodId === null ||
                this.salesChannel.shippingMethods.getIds().includes(this.amazonFbaPrimeShippingMethods.fba.shippingMethodId) === false) {
                this.amazonFbaPrimeShippingMethods.fba.shippingMethodId = defaultShippingMethodsId;
                this.amazonFbaPrimeShippingMethods.fba.code = defaultShippingMethodsCode;
            }

            if (this.amazonFbaPrimeShippingMethods.prime.shippingMethodId === null ||
                this.salesChannel.shippingMethods.getIds().includes(this.amazonFbaPrimeShippingMethods.prime.shippingMethodId) === false) {
                this.amazonFbaPrimeShippingMethods.prime.shippingMethodId = defaultShippingMethodsId;
                this.amazonFbaPrimeShippingMethods.prime.code = defaultShippingMethodsCode;
            }

            if (this.amazonFbaPrimeShippingMethods.primeNextDay.shippingMethodId === null ||
                this.salesChannel.shippingMethods.getIds().includes(this.amazonFbaPrimeShippingMethods.primeNextDay.shippingMethodId) === false) {
                this.amazonFbaPrimeShippingMethods.primeNextDay.shippingMethodId = defaultShippingMethodsId;
                this.amazonFbaPrimeShippingMethods.primeNextDay.code = defaultShippingMethodsCode;
            }

            if (this.amazonFbaPrimeShippingMethods.primeSecondDay.shippingMethodId === null ||
                this.salesChannel.shippingMethods.getIds().includes(this.amazonFbaPrimeShippingMethods.primeSecondDay.shippingMethodId) === false) {
                this.amazonFbaPrimeShippingMethods.primeSecondDay.shippingMethodId = defaultShippingMethodsId;
                this.amazonFbaPrimeShippingMethods.primeSecondDay.code = defaultShippingMethodsCode;
            }
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
