import template from './bf-sales-channel-detail.html.twig';

const {Component, Mixin, Context, Defaults} = Shopware;
const {Criteria} = Shopware.Data;
const {mapGetters, mapMutations} = Shopware.Component.getComponentHelper();

Component.register('bf-sales-channel-detail', {
    template,
    inject: [
        'repositoryFactory',
        'bfPropertyService',
        'BfSalesChannelService',
        'BfAmazonService',
        'BfEbayService',
        "BfCategoryService"
    ],
    mixins: [
        Mixin.getByName('notification'),
        Mixin.getByName('placeholder')
    ],
    shortcuts: {
        'SYSTEMKEY+S': 'onSave'
    },
    data() {
        return {
            clientExists: false,
            clientInProgress: false,
            salesChannel: null,
            isLoading: false,
            customFieldSets: [],
            isSaveSuccessful: false,
            shippingPolicy: {
                profileId: null,
                isDirty: false,
            },
            paymentPolicy: {
                profileId: null,
                isDirty: false,
            },
            returnPolicy: {
                profileId: null,
                isDirty: false,
            },
            salesChannelType: null,
        }
    },
    metaInfo() {
        return {
            title: this.$createTitle(this.identifier)
        }
    },
    ...mapMutations([
        'setCategoriesMappingStorage'
    ]),
    ...mapGetters('bfCategoryMapping', [
        'getCategoriesMappingStorage'
    ]),
    computed: {
        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        },
        toolTipSave() {
            const systemKey = this.$device.getSystemKey();

            return {
                message: `${systemKey} + S`,
                appearance: 'light'
            };
        },
    },
    created() {
        this.createdComponent();
        this.checkClientState();
    },
    watch: {
        '$route.params.id'() {
            this.createdComponent()
        }
    },
    methods: {
        checkClientState() {
            this.BfSalesChannelService.checkClientState().then((response) => {
                this.clientExists = response.clientExists;
                this.clientInProgress = response.clientInProgress;
            })
        },
        createdComponent() {
            this.loadEntityData();
        },
        loadEntityData() {
            if (!this.$route.params.id) {
                return;
            }

            if (this.$route.params.typeId) {
                return
            }

            if (this.salesChannel) {
                this.salesChannel = null;
            }

            this.loadSalesChannel();
        },
        loadSalesChannel() {
            this.isLoading = true;
            this.salesChannelRepository
                .get(this.$route.params.id, Context.api, this.getLoadSalesChannelCriteria())
                .then((entity) => {
                    this.salesChannel = entity;

                    if (!this.salesChannel.maintenanceIpWhitelist) {
                        this.salesChannel.maintenanceIpWhitelist = [];
                    }

                    this.salesChannelType = this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId);

                    this.BfSalesChannelService.setSalesChannelType(this.salesChannelType);

                    this.loadShopsConfigurations();
                    this.loadErpSystemsConfiguration();
                    this.isLoading = false;
                    this.storeApiVersion();
                    this.setUseAdminApi();
                });
        },

        /**
         * @returns {Object.Criteria}
         */
        getLoadSalesChannelCriteria() {
            const criteria = new Criteria();

            criteria.addAssociation('paymentMethods');
            criteria.addAssociation('shippingMethods');

            criteria.addAssociation('countries');
            criteria.addAssociation('currencies');
            criteria.addAssociation('languages');

            criteria.addAssociation('marketplaces');

            criteria.addAssociation('domains.language');
            criteria.addAssociation('domains.snippetSet');
            criteria.addAssociation('domains.currency');

            return criteria;
        },

        /**
         * @returns {Promise<void>}
         */
        async loadShopsConfigurations() {
            await this.BfSalesChannelService.getShopsConfigurations().then((response) => {
                let shopsConfigurations = response.data.data;
                this.salesChannel = this.BfSalesChannelService.buildShopsConfigurations(this.salesChannel, shopsConfigurations);
            }).catch((error) => {
                this.isLoading = false;
            });
        },

        /**
         * @returns {Promise<void>}
         */
        async loadErpSystemsConfiguration() {
            await this.BfSalesChannelService.getErpSystemsConfiguration().then((response) => {
                let erpSystemsConfiguration = response.data.data,
                    erpSystemsConfigurationObj = {};

                erpSystemsConfiguration.forEach(function (item) {
                    erpSystemsConfigurationObj[item.configurationKey] = item.configurationValue;
                });
                this.salesChannel.useNetPrice = erpSystemsConfigurationObj.hasOwnProperty('USE_NET_PRICE') ? erpSystemsConfigurationObj.USE_NET_PRICE === '1' : false;
            });
        },
        saveFinish() {
            this.isSaveSuccessful = false;
        },

        /**
         * @returns {Promise<void>}
         */
        async onSave() {
            this.isLoading = true;
            this.isSaveSuccessful = false;

            if (!this.salesChannel._isNew && this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId) === 'ebay' && !this.createEbaySalesChannelIsValid()){
                this.isLoading = false;
                return;
            }

            if (!this.salesChannel._isNew) {
                if (this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId) === 'ebay') {
                    await this.storeEbayPolicies();
                    await this.storeEbaySpecificShopsConfigurations();
                } else if (this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId) === 'amazon') {
                    this.storeAmazonSpecificShopsConfigurations().catch((error) => {
                        return;
                    });
                }

                await this.storeCurrencies();
                await this.storeLanguages();
                await this.storeErpSystemsConfiguration();
                await this.storeSegmentMapping();
                await this.storeCategoriesMapping();
            } else {
                await this.createDomainForSalesChannel(this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId));
                if (this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId) === 'amazon') {
                    this.salesChannel.paymentMethodId = this.getPaymentMethodIdForAmazon();
                    this.salesChannel.paymentMethods.push(await this.getPaymentMethodForAmazon());
                } else {
                    this.salesChannel.paymentMethodId = this.getPaymentMethodIdForEbay();
                    this.salesChannel.paymentMethods.push(await this.getPaymentMethodForEbay());
                }
            }

            this.saveSalesChannelData();
        },
        saveSalesChannelData() {
            this.salesChannelRepository
                .save(this.salesChannel, Context.api)
                .then(() => {
                    this.isLoading = false;
                    this.isSaveSuccessful = true;

                    if (!this.salesChannel._isNew) {
                        if (this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId) === 'amazon') {
                            this.BfSalesChannelService.updateBfConfigSwagMarketsSystem({
                                shops: {
                                    'amazon': {
                                        processing_time: this.salesChannel.processingTime
                                    }
                                }
                            })
                        }

                        if (this.salesChannel.active === true) {
                            this.BfSalesChannelService.activateDeactivateSalesChannelCronJobs(true);
                        } else {
                            this.BfSalesChannelService.activateDeactivateSalesChannelCronJobs(false);
                        }
                        this.activateDeactivateFbaOrdersCron();
                    }

                    if (this.salesChannel.marketplaceId) {
                        this.BfSalesChannelService.setSalesChannelType(this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId));
                        this.BfSalesChannelService.updateMarketplaceConfiguration({
                            marketplace_id: this.salesChannel.marketplaceId
                        });
                    }

                    this.BfSalesChannelService.storeSalesChannelLanguage(this.salesChannel);
                    this.BfSalesChannelService.storeSalesChannelCountry(this.salesChannel);
                    this.BfSalesChannelService.storeSalesChannelCurrency(this.salesChannel);

                    this.$root.$emit('sales-channel-change');
                    this.loadEntityData();

                })
                .catch((error) => {
                    this.isLoading = false;

                    if (error.response && error.response.data.errors.length === 1) {
                        if (error.response.data.errors[0].code === 999) {
                            const salesChannelTypeName = this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId);
                            this.createNotificationError({
                                title: this.$tc('global.titleSaveError'),
                                message: this.$tc('bf-sales-channel.create.duplicateSalesChannel', 0, {
                                    type: salesChannelTypeName || this.placeholder(this.salesChannel, 'name')
                                })
                            });
                        }
                    } else {
                        this.createNotificationError({
                            title: this.$tc('global.titleSaveError'),
                            message: this.$tc('sw-sales-channel.detail.messageSaveError', 0, {
                                name: this.salesChannel.name || this.placeholder(this.salesChannel, 'name')
                            })
                        });
                    }
                });
        },
        async createDomainForSalesChannel(marketPlaceUrlPrefix) {
            let snippetSetEntity = null, currencyEntity = null, languageEntity = null;

            if (this.salesChannel.domains.length === 1) {
                //remove last element of the entityCollection to prevent issue with multiple domains
                this.salesChannel.domains.pop();
            }

            if (this.salesChannel.currencyId && this.salesChannel.languageId) {
                let criteria = new Criteria(1, 1);
                await this.repositoryFactory.create('snippet_set').search(criteria, Context.api).then((entity) => {
                    snippetSetEntity = entity.first();
                });

                criteria.addFilter(Criteria.equals('id', this.salesChannel.currencyId));
                await this.repositoryFactory.create('currency').search(criteria, Context.api).then((entity) => {
                    currencyEntity = entity.first();
                })

                criteria = new Criteria(1,1);
                criteria.addFilter(Criteria.equals('id', this.salesChannel.languageId));
                await this.repositoryFactory.create('language').search(criteria, Context.api).then((entity) => {
                    languageEntity = entity.first();
                })

                const domainsEntity = this.repositoryFactory.create('sales_channel_domain').create(Context.api);
                domainsEntity.url = 'https://' + marketPlaceUrlPrefix + '.' + location.hostname;
                domainsEntity.language = languageEntity;
                domainsEntity.languageId = languageEntity.id;
                domainsEntity.currency = currencyEntity;
                domainsEntity.currencyId = currencyEntity.id;
                domainsEntity.snippetSet = snippetSetEntity;
                domainsEntity.snippetSetId = snippetSetEntity.id;
                domainsEntity.hreflangUseOnlyLocale = false;
                domainsEntity._isNew = true;

                this.salesChannel.domains.add(domainsEntity);
            }
        },
        /**
         * @returns {boolean}
         */
        createEbaySalesChannelIsValid() {
            if (this.salesChannel.paymentMethods.length === 0) {
                this.createNotificationError({
                    title: this.$tc('global.titleSaveError'),
                    message: this.$tc('ebay.paymentMethodError')
                });

                return false;
            }

            return true;
        },
        async activateDeactivateFbaOrdersCron() {
            if (this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId) === 'amazon') {
                await this.BfAmazonService.activateDeactivateFbaOrdersCron(this.BfSalesChannelService, this.salesChannel);
            }
        },

        /**
         * @returns {boolean|Boolean}
         */
        abortOnLanguageChange() {
            return this.salesChannelRepository.hasChanges(this.salesChannel);
        },

        /**
         * @returns {Promise<void>}
         */
        saveOnLanguageChange() {
            return this.onSave();
        },
        onChangeLanguage() {
            this.loadEntityData();
        },

        /**
         * @param policyName
         * @param profileId
         */
        setPolicy(policyName, profileId) {
            this[policyName].profileId = profileId;
            this[policyName].isDirty = true;
            if (profileId !== null && profileId.length > 0) {
                this.salesChannel[policyName] = true;
            }
        },
        storeEbayPolicies() {
            this.BfEbayService.storeEbayPolicies(this.BfSalesChannelService, this.shippingPolicy, this.paymentPolicy, this.returnPolicy);
        },
        async storeAmazonSpecificShopsConfigurations() {
            /** Store specific erp matching for amazon sales channel */
            await this.BfAmazonService.storeErpSystemMatchingData(this.BfSalesChannelService, this.salesChannel, true).then(() => {
            });
            /** Store specific matchings and shops configurations and payment methods */
            await this.BfAmazonService.storeShopsConfigurationData(this.BfSalesChannelService, this.salesChannel);
        },
        async storeEbaySpecificShopsConfigurations() {
            /** Store specific shops configurations*/
            await this.BfEbayService.storeShopsConfigurationData(this.BfSalesChannelService, this.salesChannel).then((result) =>{
                !result.mailIsValid ? this.ebayNotifications(this.$tc('error.notification.title'), this.$tc('error.ebay.ebayInvalidPayPalMailAddress')): null;
                !result.logoUrlIsValid ? this.ebayNotifications(this.$tc('error.notification.title'), this.$tc('error.ebay.ebayInvalidLogoUrl')): null;
            });
            /** Store specific erp matching for ebay sales channel */
            await this.BfEbayService.storeErpSystemMatchingData(this.BfSalesChannelService, this.salesChannel, true);
        },

        /**
         * Stores currencies data in erp_systems_configuration/shops_currencies
         * @returns {Promise<void>}
         */
        async storeCurrencies() {
            await this.BfSalesChannelService.storeErpSystemsConfigurationCurrenciesMatching(
                await this.BfSalesChannelService.getSelectedCurrencyEntity(this.salesChannel.currencyId), true);
        },

        /**
         * Stores languages data in erp_systems_configurations/shops_languages
         * @returns {Promise<void>}
         */
        async storeLanguages() {
            await this.BfSalesChannelService.storeErpSystemsConfigurationLanguagesMatching(
                await this.BfSalesChannelService.getSelectedLanguagesEntity(this.salesChannel.languageId), true);
        },

        /**
         * Stores the plain erp systems configuration
         * @returns {Promise<void>}
         */
        async storeErpSystemsConfiguration() {
            await this.BfSalesChannelService.storeErpSystemsConfiguration(
                {
                    USE_NET_PRICE: this.salesChannel.useNetPrice === true ? '1' : '0',
                }
            );
        },

        /**
         * @returns {Promise<void>}
         */
        async storeApiVersion() {
            await this.BfSalesChannelService.storeApiVersion();
        },

        /**
         * @returns {Promise<void>}
         */
        async setUseAdminApi() {
            await this.BfSalesChannelService.storeUseAdminApi();
        },

        /**
         *
         * @returns {Promise<void>}
         */
        async storeSegmentMapping() {
            let preparedSegmentToSave = JSON.parse(localStorage.getItem('productSegment'));

            if (preparedSegmentToSave !== null && preparedSegmentToSave !== 'null') {
                this.BfCategoryService.storeCategorySegmentMapping(preparedSegmentToSave)
                    .then((response) => {
                        this.createNotificationSuccess({
                            title: this.$tc('bf-category-segment-mapping.notification.title'),
                            message: this.$tc('bf-category-segment-mapping.notification.messageSuccess')
                        });

                        localStorage.setItem('productSegment', null)
                        this.isLoading = false;
                    })
                    .catch((error) => {
                        console.log(error);

                        this.createNotificationError({
                            title: this.$tc('bf-category-segment-mapping.notification.title'),
                            message: this.$tc('bf-category-segment-mapping.notification.messageError')
                        });

                        this.isLoading = false;
                    });
            }
        },
        /**
         *
         * @param title {string}
         * @param message {string}
         */
        ebayNotifications(title = '', message = '') {
            this.createNotificationError({title: title, message: message});
        },

        /**
         *
         * @returns {Promise<null>}
         */
        async getPaymentMethodForAmazon() {
            return await this.BfSalesChannelService.getSelectedPaymentMethodEntity(this.salesChannel.paymentMethodId);
        },

        /**
         * @returns {Promise<null>}
         */
        async getPaymentMethodForEbay() {
            return await this.BfSalesChannelService.getSelectedPaymentMethodEntity(this.salesChannel.paymentMethodId);
        },

        /**
         * @returns {string}
         */
        getPaymentMethodIdForAmazon() {
            return 'ea606c4e4752dd3edd06ee8641e5ef4a';
        },

        /**
         * @returns {string}
         */
        getPaymentMethodIdForEbay() {
            return '05d8e3bdac2b4ed7939bf3f8bfd0b94d';
        }
    }
})
