import template from './bf-sales-channel-product-modal.html.twig';

const {Component, Mixin} = Shopware;
const {EntityCollection} = Shopware.Data;

Component.register('bf-sales-channel-product-modal', {
    template,
    inject: [
        'bfProductApiService',
        'BfCategoryService',
        'BfSalesChannelService'
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
        product: {
            type: Object,
            required: true
        },
        currentContract: {
            type: Object,
            required: true
        },
        shopProductData: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            allConditions: [],
            allPolicies: {
                shipping: [],
                returns: [],
                payments: []
            },
            isLoading: true,
            salesChannelType: '',
            activeTab: 'general',
            categories: [],
            formData: {
                bfProductId: null,
                conditionAttribute: null,
                conditionNote: '',
                ebayPlus: false,
                ebayProposedPrice: {
                    ebayBestOfferActive: false,
                    ebayBestOfferAbsolute: 0,
                    ebayBestOfferRelative: 0,
                    ebayBestOfferAutoAccept: false,
                    ebayBestOfferAbsoluteAutoAccept: 0,
                    ebayBestOfferRelativeAutoAccept: 0
                },
                policies: {
                    shipping: null,
                    returns: null,
                    payments: null
                },
                merchantShippingGroupName: '',
                searchTerms: '',
                platinumKeywords: '',
                fbaActive: '',
                category: ''
            },
            parentProduct: [],
            productData: []
        }
    },
    created() {
        this.bfProductApiService.setSalesChannelId(this.$route.params.id);
        this.componentCreated();
    },
    computed: {
        isDisabled() {
            return !this.clientExists
                || this.clientInProgress
                || this.currentContract.name === ''
                || this.currentContract.name === 'Starter';
        }
    },
    methods: {
        async componentCreated() {
            const data = typeof this.shopProductData[this.product.id] !== 'undefined'
                ? this.shopProductData[this.product.id]
                : null;

            if (data !== null) {
                if (data.hasOwnProperty('ebayProposedPrice') && data.ebayProposedPrice !== null) {
                    this.formData.ebayProposedPrice = data.ebayProposedPrice;

                    for (let key in this.formData.ebayProposedPrice) {
                        this.formData.ebayProposedPrice[key] = parseInt(this.formData.ebayProposedPrice[key]);
                    }
                }

                this.formData.bfProductId = data.bfProductId;
                this.formData.merchantShippingGroupName = data.hasOwnProperty('merchantShippingGroupName') && data.merchantShippingGroupName !== null ? data.merchantShippingGroupName : '';
                this.formData.searchTerms = data.hasOwnProperty('searchTerms') && data.platinumKeywords !== null ? data.searchTerms : '';
                this.formData.platinumKeywords = data.hasOwnProperty('platinumKeywords') && data.platinumKeywords !== null ? data.platinumKeywords.join(',') : '';
                this.formData.ebayPlus = data.hasOwnProperty('ebayPlus') && data.ebayPlus !== null ? data.ebayPlus === 1 : false;
                this.formData.conditionAttribute = data.hasOwnProperty('conditionId') && data.conditionId !== null ? data.conditionId : null;
                this.formData.conditionNote = data.hasOwnProperty('conditionNote') && data.conditionNote !== null ? data.conditionNote : '';
                this.formData.fbaActive = data.hasOwnProperty('fbaActive') && data.fbaActive !== null ? data.fbaActive === 1 : false;
                this.formData.policies.shipping = data.hasOwnProperty('shippingPolicy') && data.shippingPolicy !== null ? data.shippingPolicy : null;
                this.formData.policies.returns = data.hasOwnProperty('returnsPolicy') && data.returnsPolicy !== null ? data.returnsPolicy : null;
                this.formData.policies.payments = data.hasOwnProperty('paymentsPolicy') && data.paymentsPolicy !== null ? data.paymentsPolicy : null;
                this.formData.ebayProposedPrice.ebayBestOfferActive = this.formData.ebayProposedPrice.ebayBestOfferActive !== '' ? this.formData.ebayProposedPrice.ebayBestOfferActive === '1' : false;
                this.formData.ebayProposedPrice.ebayBestOfferAutoAccept = this.formData.ebayProposedPrice.ebayBestOfferAutoAccept !== '' ? this.formData.ebayProposedPrice.ebayBestOfferAutoAccept === '1' : false;
            }

            this.isLoading = true;

            await this.bfProductApiService.getSalesChannelType().then((result) => {
                this.salesChannelType = result;
                this.getAllConditions();
            });

            await this.getProductData();
            this.loadPolicies();
            this.isLoading = false;
        },
        changeFormInputValue(fieldName, event) {
            this.formData.ebayProposedPrice[fieldName] = event;

        },
        async getProductData() {
            await this.bfProductApiService.getProductData([this.product.id])
                .then((product) => {
                    if (product.success) {
                        this.productData = product.data[0];

                        if (this.productData.categories.length <= 0) {
                            this.product.categories = new EntityCollection('/bf-sales-channel', 'category', Shopware.Context.api, null, this.categoryCollection);
                            return;
                        }
                        this.BfCategoryService.findCategoriesById(this.productData.categories)
                            .then(async (result) => {

                                let channelsId = this.productData.categories[0].channels_id;
                                this.product.categoryTree = [];

                                await result.forEach((item) => {
                                    if (item.channels_id === channelsId) {
                                        this.categories.push(item);
                                        this.getCategoryTree(item.parent_id).then((result) => {
                                            if (this.categories.length > 0) {
                                                this.categories.forEach((category) => {
                                                    this.product.categoryTree.push(category.id.toString());
                                                });
                                            }
                                        }).catch((error) => {
                                            console.log(error);
                                        });
                                    }
                                });

                                const categories = new EntityCollection('/bf-sales-channel', 'category', Shopware.Context.api, null, this.categoryCollection);

                                result.forEach((item) => {
                                    if (item.channels_id === channelsId) {
                                        item.id = item.id.toString();

                                        categories.add({
                                            data: item,
                                            id: item.id.toString(),
                                            categoryId: item.external_channels_categories_id,
                                            name: item.name,
                                            translated: {
                                                name: item.name,
                                            },
                                            childCount: item.children,
                                            parentId: item.parent_id,
                                            afterCategoryId: item.parent_id,
                                        });
                                    }
                                });

                                this.product.categories = categories;
                            }).catch((error) => {
                            console.log(error);
                        })
                    }
                }).catch((error) => {
                console.log(error);
            });
        },
        async getCategoryTree(categoryId = null) {
            if (categoryId != null) {
                return await this.BfCategoryService.getCategoryById(categoryId)
                    .then(async (result) => {
                        result.id = result.id === null ? result.id : result.id.toString();

                        this.categories.push({
                            data: result,
                            id: result.id,
                            categoryId: result.external_channels_categories_id,
                            name: result.name,
                            translated: {
                                name: result.name,
                            },
                            childCount: result.children,
                            parentId: result.parent_id=== null ? result.parent_id : result.parent_id.toString(),
                            afterCategoryId: result.parent_id === null ? result.parent_id : result.parent_id.toString()
                        });
                        await this.getCategoryTree(result.parent_id);

                        return Promise.resolve();
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            }
        },
        saveData() {
            const data = typeof this.shopProductData[this.product.id] !== 'undefined'
                ? this.shopProductData[this.product.id]
                : null;

            if (data !== null) {
                this.bfProductApiService.saveProductData(
                    data.bfProductId,
                    {
                        merchantShippingGroupName: this.formData.merchantShippingGroupName,
                        searchTerms: this.formData.searchTerms,
                        platinumKeywords: this.formData.platinumKeywords !== null ? this.formData.platinumKeywords.split(', ') : [],
                        proposedPrice: {
                            EBAY_BEST_OFFER_ACTIVE: this.formData.ebayProposedPrice.ebayBestOfferActive ? 1 : 0,
                            EBAY_BEST_OFFER_ABSOLUTE: this.formData.ebayProposedPrice.ebayBestOfferAbsolute,
                            EBAY_BEST_OFFER_RELATIVE: this.formData.ebayProposedPrice.ebayBestOfferRelative,
                            EBAY_BEST_OFFER_AUTO_ACCEPT: this.formData.ebayProposedPrice.ebayBestOfferAutoAccept ? 1 : 0,
                            EBAY_BEST_OFFER_ABSOLUTE_AUTO_ACCEPT: this.formData.ebayProposedPrice.ebayBestOfferAbsoluteAutoAccept,
                            EBAY_BEST_OFFER_RELATIVE_AUTO_ACCEPT: this.formData.ebayProposedPrice.ebayBestOfferRelativeAutoAccept,
                        },
                        ebayPlus: this.formData.ebayPlus ? 1 : 0,
                        conditionAttribute: this.formData.conditionAttribute,
                        conditionNote: this.formData.conditionNote,
                        shippingPolicy: this.formData.policies.shipping,
                        returnsPolicy: this.formData.policies.returns,
                        paymentsPolicy: this.formData.policies.payments,
                        fbaActive: this.formData.fbaActive ? 1 : 0,
                        shopsCategories: [...this.product.categories.map(i => i.categoryId)]
                    }
                ).then((response) => {
                    this.isLoading = false;

                    let data = response.data;

                    data.errors = this.shopProductData[this.product.id].errors;

                    this.shopProductData[this.product.id] = data;

                    return this.createNotificationSuccess({
                        title: this.$tc('products.edit.notification.title.success'),
                        message: this.$tc('products.edit.notification.message.success')
                    });
                }).catch(() => {
                    this.isLoading = false;

                    this.$emit('modal-close');

                    return this.createNotificationError({
                        title: this.$tc('products.edit.notification.title.error'),
                        message: this.$tc('products.edit.notification.message.error')
                    });
                });
            } else {
                this.$emit('modal-close');

                this.createNotificationError({
                    title: this.$tc('products.edit.notification.title.error'),
                    message: this.$tc('products.edit.notification.message.error')
                })
            }
        },
        getAllConditions() {
            let defaultConditionValue = '1000';

            if (this.salesChannelType === 'amazon') {
                this.getAllAmazonConditions();
                defaultConditionValue = 'New';
            } else {
                this.getAllEbayConditions();
            }

            this.formData.conditionAttribute = this.formData.conditionAttribute === null
                ? defaultConditionValue
                : this.formData.conditionAttribute;
        },
        getAllEbayConditions() {
            this.allConditions = [
                {
                    value: '1000',
                    label: this.$tc('products.edit.conditions.ebay.new')
                },
                {
                    value: '2750',
                    label: this.$tc('products.edit.conditions.ebay.asNew')
                },
                {
                    value: '3000',
                    label: this.$tc('products.edit.conditions.ebay.used')
                },
                {
                    value: '4000',
                    label: this.$tc('products.edit.conditions.ebay.veryGood')
                },
                {
                    value: '5000',
                    label: this.$tc('products.edit.conditions.ebay.good')
                },
                {
                    value: '6000',
                    label: this.$tc('products.edit.conditions.ebay.acceptable')
                },
            ];
        },
        getAllAmazonConditions() {
            this.allConditions = [
                {
                    value: 'New',
                    label: this.$tc('products.edit.conditions.amazon.new')
                },
                {
                    value: 'UsedLikeNew',
                    label: this.$tc('products.edit.conditions.amazon.usedLikeNew')
                },
                {
                    value: 'UsedVeryGood',
                    label: this.$tc('products.edit.conditions.amazon.usedVeryGood')
                },
                {
                    value: 'UsedGood',
                    label: this.$tc('products.edit.conditions.amazon.usedGood')
                },
                {
                    value: 'UsedAcceptable',
                    label: this.$tc('products.edit.conditions.amazon.usedAcceptable')
                },
                {
                    value: 'CollectibleLikeNew',
                    label: this.$tc('products.edit.conditions.amazon.collectibleLikeNew')
                },
                {
                    value: 'CollectibleVeryGood',
                    label: this.$tc('products.edit.conditions.amazon.collectibleVeryGood')
                },
                {
                    value: 'CollectibleGood',
                    label: this.$tc('products.edit.conditions.amazon.collectibleGood')
                },
                {
                    value: 'CollectibleAcceptable',
                    label: this.$tc('products.edit.conditions.amazon.collectibleAcceptable')
                },
                {
                    value: 'Refurbished',
                    label: this.$tc('products.edit.conditions.amazon.refurbished')
                },
                {
                    value: 'Club',
                    label: this.$tc('products.edit.conditions.amazon.club')
                }
            ];
        },
        loadPolicies() {
            this.getShippingPolicies();
            this.getPaymentPolicies();
            this.getReturnPolicies();
        },
        async getShippingPolicies() {
            await this.BfSalesChannelService.getEbayPolicy('shipping').then((response) => {
                if (response.status === 200 && response.data.success === true) {
                    if (response.data.data.length > 0) {
                        this.allPolicies.shipping = this.buildPolicies(response.data.data);
                    }
                }
            });
        },
        async getPaymentPolicies() {
            await this.BfSalesChannelService.getEbayPolicy('payment').then((response) => {
                if (response.status === 200 && response.data.success === true) {
                    if (response.data.data.length > 0) {
                        this.allPolicies.payments = this.buildPolicies(response.data.data);
                    }
                }
            });
        },
        async getReturnPolicies() {
            await this.BfSalesChannelService.getEbayPolicy('return').then((response) => {
                if (response.status === 200 && response.data.success === true) {
                    if (response.data.data.length > 0) {
                        this.allPolicies.returns = this.buildPolicies(response.data.data);
                    }
                }
            });
        },
        buildPolicies(data) {
            let policies = [{label: this.$tc('products.edit.noInformation'), value: null}];

            data.forEach((item) => {
                policies.push({label: item.profileName, value: item.profileId})
            });

            return policies;
        }
    }
});
