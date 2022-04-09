import template from './bf-sales-channel-ebay-policy.html.twig';

const {Component} = Shopware;
Component.register('bf-sales-channel-ebay-policy', {
    template,
    inject: ['BfSalesChannelService'],
    props: {
        salesChannel: null,
        clientRdy: false
    },
    data() {
        return {
            showPolicies: false,
            shippingPolicy: {
                shippingPolicies: [{label: '', value: ''}],
                shippingPoliciesIsLoading: false,
                selectedShippingPolicy: null
            },
            paymentPolicy: {
                paymentPolicies: [{label: '', value: ''}],
                paymentPoliciesIsLoading: false,
                selectedPaymentPolicy: null
            },
            returnPolicy: {
                returnPolicies: [{label: '', value: ''}],
                returnPoliciesIsLoading: false,
                selectedReturnPolicy: null
            },
            errorLoadingPolicies: false
        }
    },
    watch: {
        salesChannel: function (salesChannel, oldSalesChannel) {
            if (oldSalesChannel === null && salesChannel !== null &&
                this.$route.meta.$module.getSalesChannelByTypeId(salesChannel.typeId) === 'ebay') {
                this.showPolicies = true;
            }
        },
        clientRdy: function (clientRdy) {
            if (clientRdy === true) {
                if (this.salesChannel !== null && this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId) === 'ebay'){
                    this.loadPolicies();
                    this.loadData();
                }
            }
        },
        'shippingPolicy.selectedShippingPolicy': function (profileId) {
            this.$emit('setPolicy', 'shippingPolicy', profileId)
        },
        'paymentPolicy.selectedPaymentPolicy': function (profileId) {
            this.$emit('setPolicy', 'paymentPolicy', profileId)
        },
        'returnPolicy.selectedReturnPolicy': function (profileId) {
            this.$emit('setPolicy', 'returnPolicy', profileId)
        }
    },
    methods: {
        loadPolicies(){
            this.getShippingPolicies();
            this.getPaymentPolicies();
            this.getReturnPolicies();
        },
        async getShippingPolicies() {
            this.shippingPolicy.shippingPoliciesIsLoading = true;
            await this.BfSalesChannelService.getEbayPolicy('shipping').then((response) => {
                if (response.status === 200 && response.data.success === true) {
                    if (response.data.data.length > 0) {
                        this.shippingPolicy.shippingPolicies = this.buildPolicies(response.data.data);
                    }
                }
            }).catch((error) =>{
                this.errorLoadingPolicies = true;
            });
            this.shippingPolicy.shippingPoliciesIsLoading = false;
        },
        async getPaymentPolicies() {
            this.paymentPolicy.paymentPoliciesIsLoading = true;
            await this.BfSalesChannelService.getEbayPolicy('payment').then((response) => {
                if (response.status === 200 && response.data.success === true) {
                    if (response.data.data.length > 0) {
                        this.paymentPolicy.paymentPolicies = this.buildPolicies(response.data.data);
                    }
                }
            }).catch((error) =>{
                this.errorLoadingPolicies = true;
            });
            this.paymentPolicy.paymentPoliciesIsLoading = false;
        },
        async getReturnPolicies() {
            this.returnPolicy.returnPoliciesIsLoading = true;
            await this.BfSalesChannelService.getEbayPolicy('return').then((response) => {
                if (response.status === 200 && response.data.success === true) {
                    if (response.data.data.length > 0) {
                        this.returnPolicy.returnPolicies = this.buildPolicies(response.data.data);
                    }
                }
            }).catch((error) =>{
                this.errorLoadingPolicies = true;
            });
            this.returnPolicy.returnPoliciesIsLoading = false;
        },
        async loadData() {
            await this.BfSalesChannelService.getShopsConfigurations('ebay').then((response) => {
                if (response.status === 200 && response.data.success === true) {
                    let data = response.data.data;
                    if (data.hasOwnProperty('SHIPPING_POLICY')) {
                        this.shippingPolicy.selectedShippingPolicy = data.SHIPPING_POLICY;
                    }

                    if (data.hasOwnProperty('PAYMENT_POLICY')) {
                        this.paymentPolicy.selectedPaymentPolicy = data.PAYMENT_POLICY;
                    }

                    if (data.hasOwnProperty('RETURN_POLICY')) {
                        this.returnPolicy.selectedReturnPolicy = data.RETURN_POLICY;
                    }
                }
            });
        },
        buildPolicies(data) {
            let policies = [];
            data.forEach((item) => {
                policies.push({label: item.profileName, value: item.profileId})
            });
            return policies;
        }
    },
    created() {
        if (this.salesChannel !== null && this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId) === 'ebay'){
            this.showPolicies = true;
            if (this.clientRdy === true) {
                this.loadPolicies();
                this.loadData();
            }
        }
    }
});
