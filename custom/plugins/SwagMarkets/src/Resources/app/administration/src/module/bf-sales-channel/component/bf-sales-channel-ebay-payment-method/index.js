import template from './bf-sales-channel-ebay-payment-method.html.twig'
import './bf-sales-channel-ebay-payment-method.scss';

const paymentToBfInternalPaymentId = {
    payPal: 13, moneyXferAcceptedInCheckout: 2, cashOnPickup: 10,
    cod: 3, ebayPayments: 61
};
const {Component, Context, Mixin} = Shopware;
const {Criteria, EntityCollection} = Shopware.Data;

Component.extend('bf-sales-channel-ebay-payment-method', 'sw-sales-channel-defaults-select', {
    template,
    inject: [
        'BfSalesChannelService',
        'repositoryFactory'
    ],
    mixins: [
        Mixin.getByName('notification')
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
        propertyName: {
            type: String,
            required: true
        },
        defaultPropertyName: {
            type: String,
            required: true
        },
        salesChannel: {
            type: Object,
            required: true
        },
    },
    data() {
        return {
            payments: [{name: this.$tc('bf-sales-channel.detail.ebayPaymentSelectName'), id: '####111111####'}],
            selectedPayment: {
                payPal: {
                    id: null
                },
                moneyXferAcceptedInCheckout: {
                    id: null
                },
                cashOnPickup: {
                    id: null
                },
                cod: {
                    id: null
                },
                ebayPayments: {
                    id: null
                }
            },
            focusPropName: null,
            paymentMethodsCreated: false,
            paymentMethodObjectCount: 0,
            ebayPayments: [],
            loadingPaymentMatching: false
        }
    },
    watch: {
        salesChannel: function (newVal, oldVal) {
            if (oldVal === null && newVal !== null) {
                this.paymentMethodsCreated = false;
                this.loadComponent();
            }
        }
    },
    computed: {
        paymentMethodRepository() {
            return this.repositoryFactory.create(this.propertyCollection.entity);
        },
        isDisabled() {
            return !this.clientExists || this.clientInProgress;
        }
    },
    methods: {
        /**
         * @param paymentMethodsId string
         * @param paymentMethodProp string
         */
        async changedEbayPayment(paymentMethodsId, paymentMethodProp) {
            let me = this;
            const newCollection = EntityCollection.fromCollection(me.propertyCollection);

            this.payments.forEach(function (data, index) {
                if (data.id === paymentMethodsId) {
                    newCollection.remove(me.selectedPayment[paymentMethodProp].id);
                    me.removeEbayPaymentData(paymentMethodProp);

                    if (data.id !== '####111111####') {
                        me.payments[index].disabled = true;
                        me.prepareEbayPaymentData(data.name, paymentMethodsId, paymentMethodProp);
                        newCollection.add(data);
                    }

                    if (me.selectedPayment[paymentMethodProp].id !== null) {
                        me.enableSelectValue(me.selectedPayment[paymentMethodProp].id);
                    }

                    if (paymentMethodsId === '####111111####') {
                        paymentMethodsId = null;
                    }

                    me.selectedPayment[paymentMethodProp].id = paymentMethodsId;
                    me.updateCollectionData(newCollection)
                }
            });

            this.salesChannel.ebayPaymentMethods = this.ebayPayments;
            await this.setNoPaymentMethodMatching();
        },
        /**
         * @param paymentMethodsId string
         */
        enableSelectValue(paymentMethodsId) {
            let me = this;

            this.payments.forEach(function (data, index) {
                if (data.id === paymentMethodsId) {
                    me.payments[index].disabled = false;
                }
            });
        },
        async loadComponent() {
            let me = this;
            this.loadingPaymentMatching = true;
            if (this.salesChannel !== null) {
                this.salesChannel.noPaymentMethodMatching = true;

                await this.getPaymentMethods().then((paymentMethods) => {
                    if (paymentMethods.length > 0 && this.paymentMethodsCreated === false) {
                        this.payments = [{
                            name: this.$tc('bf-sales-channel.detail.ebayPaymentSelectName'),
                            id: '####111111####'
                        }];

                        paymentMethods.forEach(function (item) {
                            me.paymentMethodObjectCount += 1;
                            me.payments.push(
                                {
                                    name: item.name,
                                    id: item.id,
                                    disabled: false
                                }
                            )
                        });
                        this.paymentMethodsCreated = true;
                        this.loadPaymentMethodsMatching();
                    }
                });
            }
            this.loadingPaymentMatching = false;
        },
        async loadPaymentMethodsMatching() {
            let me = this;
            await this.BfSalesChannelService.getBfConfigSwagMarketsSystem(true).then((config) => {
                if (config !== null && config !== undefined && config.hasOwnProperty('payment_methods_matching')) {
                    if (config.payment_methods_matching.length > 0) {
                        this.salesChannel.ebayPaymentMethods = config.payment_methods_matching;
                        this.ebayPayments = config.payment_methods_matching;
                        this.setNoPaymentMethodMatching();

                        config.payment_methods_matching.forEach(function (item) {
                            let payment = me.reMapIdToPayment(item.paymentMethodsId)
                            if (payment !== null) {
                                let result = item.erpPaymentMethodsCode.match(/##(.*?)##/g).map(function (val) {
                                    return val.replace(/##/g, '');
                                });
                                me.selectedPayment[payment].id = result[0];
                                me.payments.forEach(function (content){
                                    if(content.id === result[0]) {
                                        content.disabled = true;
                                    }
                                });
                            }
                        });
                    }
                }
            });
        },
        updateCollectionData(newCollection) {
            this.updateCollection(newCollection);
            this.updateDefaultId(newCollection);
        },
        updateDefaultId(newCollection) {
            if (this.defaultId === null) {
                if (newCollection[0] !== undefined) {
                    this.defaultId = newCollection[0].id
                } else {
                    this.createNotificationError({
                        title: this.$tc('error.notification.title'),
                        message: this.$tc('bf-sales-channel.detail.noPaymentMethodsSelected')
                    });
                }
            }
        },
        /**
         * @returns {Promise<null>}
         */
        async getPaymentMethods() {
            return this.paymentMethodRepository.search(new Criteria(1,500), Context.api).then((result) => {
                return result;
            });
        },
        /**
         * @param name string
         * @param paymentMethodId string
         * @param paymentPropName string
         */
        prepareEbayPaymentData(name, paymentMethodId, paymentPropName) {
            if (paymentToBfInternalPaymentId.hasOwnProperty(paymentPropName)) {
                if (this.ebayPayments.length > 0) {
                    let found = false;
                    this.ebayPayments.forEach(function (item, index) {
                        if (item.paymentMethodsId === paymentToBfInternalPaymentId[paymentPropName]) {
                            found = true;
                            item.erpPaymentMethodsCode =  name + " ##" + paymentMethodId + "##"
                        }
                    });

                    if (found === false) {
                        this.ebayPayments.push({
                            paymentMethodsId: paymentToBfInternalPaymentId[paymentPropName],
                            erpPaymentMethodsCode: name + " ##" + paymentMethodId + "##"
                        })
                    }
                } else {
                    this.ebayPayments.push({
                        paymentMethodsId: paymentToBfInternalPaymentId[paymentPropName],
                        erpPaymentMethodsCode: name + " ##" + paymentMethodId + "##"
                    })
                }
            }
        },
        removeEbayPaymentData(paymentPropName){
            let me = this;
            if (paymentToBfInternalPaymentId.hasOwnProperty(paymentPropName)) {
                if (this.ebayPayments.length > 0) {
                    this.ebayPayments.forEach(function (item, index) {
                        if (item.paymentMethodsId === paymentToBfInternalPaymentId[paymentPropName]) {
                            me.ebayPayments.splice(index, 1);
                        }
                    })
                }
            }
        },
        /**
         * @param id int
         */
        reMapIdToPayment(id) {
            const bfInternalPaymentIdToPayment = {
                13: 'payPal', 2: 'moneyXferAcceptedInCheckout', 10: 'cashOnPickup', 3: 'cod', 61: 'ebayPayments'
            };

            if (bfInternalPaymentIdToPayment.hasOwnProperty(id)) {
                return bfInternalPaymentIdToPayment[id];
            }

            return null;
        },
        async setNoPaymentMethodMatching() {
            this.salesChannel.noPaymentMethodMatching = this.salesChannel.ebayPaymentMethods.length === 0;
        }
    },
    created() {
        if (this.salesChannel !== null) {
            this.loadComponent();
        }
    }
})
