import template from './bf-sales-channel-detail-amazon-prime-fba.html.twig';

const {Component, Mixin, Context} = Shopware;
const {Criteria} = Shopware.Data;

Component.register('bf-sales-channel-detail-amazon-prime-fba', {
    template,
    mixins:   [
        Mixin.getByName('notification')
    ],
    inject:   [
        'bfContractService',
        'repositoryFactory',
        'BfSalesChannelService',
        'BfAmazonService',
    ],
    props:    {
        salesChannel: {
            required: true
        },
        isLoading:    {
            type: Boolean
        }
    },
    data() {
        return {
            clientExists:         false,
            clientInProgress:     false,
            isSalesChannelAmazon: false,
            currentContract:      {},
            startInterval:        false,
            intervalId:           null
        }
    },
    computed: {
        currentContractName() {
            if (this.currentContract.name === null || this.currentContract.name === undefined) {
                return '';
            }

            return this.currentContract.name;
        },
        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        },
        async salesChannelType() {
            const criteria = new Criteria();
            criteria.addFilter(Criteria.equals('id', this.$route.params.id));

            return await this.salesChannelRepository.search(criteria, Context.api)
                .then((response) => {
                    return this.$route.meta.$module.getSalesChannelByTypeId(response.first().typeId)
                });
        },
    },
    watch:    {
        isLoading:     function (isLoading) {
            if (isLoading === false) {
                this.checkClientState();
                this.isLoadingBaseData = isLoading;
            } else if (isLoading === true) {
                this.isLoadingBaseData = true;
            }
        },
        startInterval: function (newVal) {
            if (newVal === true) {
                this.intervalId = setInterval(this.timedClientStateCheck, 10000);
            }
        },
        salesChannelType() {
            Promise.resolve(this.salesChannelType).then((result) => {
                this.isSalesChannelAmazon = result === 'amazon';
            });
        }
    },
    methods:  {
        setSalesChannelAttributeValue(attributeName, value) {
            this.salesChannel[attributeName] = value;
        },
        checkClientState() {
            this.timedClientStateCheck();
        },
        getContractDetails() {
            return this.bfContractService.getContracts()
                .then((contracts) => {
                    if (contracts.current !== null) {
                        this.currentContract = contracts.current;
                    }
                    return contracts;
                })
                .catch((error) => {
                    this.handleSbpError(error);
                });
        },
        timedClientStateCheck() {
            if (this.salesChannel._isNew) {
                return;
            }
            this.BfSalesChannelService.checkClientState().then((response) => {
                this.clientExists = response.clientExists;

                this.clientInProgress = response.clientInProgress;
                if (this.clientInProgress === true) {
                    this.startInterval = true;
                } else {
                    clearInterval(this.intervalId);
                    this.sendSystemData();
                    this.sendErpSystemMatching();
                }
            }).catch((error) => {
                this.isLoadingBaseData = false;
            })
        },
        async sendSystemData() {
            if (this.salesChannel._isNew) {
                return;
            }
            const salesChannelType = await this.BfSalesChannelService.getSalesChannelType();

            await this.BfSalesChannelService.storeIntegrationUserCredentialsToBf().then((response) => {
                if (response !== undefined && response !== false && response.status === 200 && response.data.success === true) {
                    this.BfSalesChannelService.updateBfConfigSwagMarketsSystem({
                        erp_systems: {
                            base_configuration_is_set: true
                        }
                    });
                }
            });

            await this.BfSalesChannelService.storeSalesChannelDataToBf({
                API_URL:                    window.location.origin + '/sales-channel-api/',
                SHOPWARE_SALES_CHANNEL_ID:  this.salesChannel.id,
                SHOPWARE_SALES_CHANNEL_KEY: this.salesChannel.accessKey,
                DEFAULT_DELIVERY_TIMES:     this.salesChannel.processingTime
            }).then((response) => {
                if (response !== undefined && response !== false && response.status === 200 && response.data.success === true) {
                    this.BfSalesChannelService.updateBfConfigSwagMarketsSystem({
                        shops: {
                            [salesChannelType]: {
                                base_configuration_is_set: true
                            }
                        }
                    });
                }
            });
        },
        async sendErpSystemMatching() {
            if (await this.BfSalesChannelService.getSalesChannelType() === 'amazon') {
                await this.BfAmazonService.storeErpSystemMatchingData(this.BfSalesChannelService, this.salesChannel);
            }

            await this.BfSalesChannelService.storeErpSystemsConfigurationCurrenciesMatching(
                await this.BfSalesChannelService.getSelectedCurrencyEntity(this.salesChannel.currencyId));

            await this.BfSalesChannelService.storeErpSystemsConfigurationLanguagesMatching(
                await this.BfSalesChannelService.getSelectedLanguagesEntity(this.salesChannel.languageId));
        },
        handleSbpError(error) {
            if (error.response === undefined) {
                this.userAuthorised = false;
            } else {
                let errorResponse = error.response.data;

                this.createNotificationError({
                    title:   errorResponse.title,
                    message: errorResponse.description
                });
            }
        },
    },
    created() {
        this.BfSalesChannelService.setSalesChannelId(this.$route.params.id);

        //Need only to check client when route is not create
        if (this.salesChannel !== null && this.$route.name !== 'bf.sales.channel.create.base') {
            this.checkClientState();
        } else if (this.$route.name === 'bf.sales.channel.create.base') {
            this.isLoadingBaseData = false;
        }
    }
})
