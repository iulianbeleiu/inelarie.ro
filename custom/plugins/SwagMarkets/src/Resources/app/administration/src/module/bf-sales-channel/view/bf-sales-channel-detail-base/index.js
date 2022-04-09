import template from './bf-sales-channel-detail-base.html.twig';
import './bf-sales-channel-detail-base.scss';
import '../../component/bf-sales-channel-ebay-policy';
import '../../component/bf-sales-channel-ebay-token-expires';
import '../../component/bf-sales-channel-ebay-payment-method';


const {Component, Mixin, Context, Defaults} = Shopware;
const {Criteria} = Shopware.Data;

const {mapPropertyErrors} = Component.getComponentHelper();

Component.register('bf-sales-channel-detail-base', {
    template,
    mixins: [
        Mixin.getByName('notification'),
        Mixin.getByName('placeholder')
    ],
    inject: [
        'bfPropertyService',
        'salesChannelService',
        'repositoryFactory',
        'BfSalesChannelService',
        'bfContractService',
        'BfAmazonService',
        'BfEbayService'
    ],
    props: {
        salesChannel: {
            required: true
        },
        isLoading: {
            type: Boolean
        }
    },
    data() {
        return {
            bookableContracts: [],
            creatingNewSalesChannel: false,
            showDeleteModal: false,
            defaultSnippetSetId: '71a916e745114d72abafbfdc51cbd9d0',
            marketplaceSettings: null,
            isConnected: false,
            isSegmentLoading: false,
            clientExists: false,
            clientInProgress: false,
            showNotificationBox: false,
            isLoadingBaseData: true,
            connectionAssistantRouterLink: {
                name: ''
            },
            bfBpUnauthorized: false,
            connectionAssistantBtnStartDisabled: false,
            intervalId: null,
            startInterval: false,
            isSalesChannelAmazon: false,
            isSalesChannelEbay: false,
            userAuthorised: false,
            currentContract: {},
            productMigrationRequest: false,
            subProcessorData: ''
        }
    },
    computed: {
        currentContractName() {
            if (this.currentContract.name === null || this.currentContract.name === undefined) {
                return '';
            }

            return this.currentContract.name;
        },
        secretAccessKeyFieldType() {
            return this.showSecretAccessKey ? 'text' : 'password'
        },
        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        },
        mainNavigationCriteria() {
            const criteria = new Criteria(1, 10);

            return criteria.addFilter(Criteria.equals('type', 'page'));
        },
        async salesChannelType() {
            const criteria = new Criteria();
            criteria.addFilter(Criteria.equals('id', this.$route.params.id));

            return await this.salesChannelRepository.search(criteria, Context.api)
                .then((response) => {
                    return this.$route.meta.$module.getSalesChannelByTypeId(response.first().typeId)
                });
        },
        maintenanceIpWhitelist: {
            get() {
                return this.salesChannel.maintenanceIpWhitelist ? this.salesChannel.maintenanceIpWhitelist : [];
            },
            set(value) {
                this.salesChannel.maintenanceIpWhitelist = value;
            }
        },
        isDomainAware() {
            const domainAware = [Defaults.storefrontSalesChannelTypeId, Defaults.apiSalesChannelTypeId, '26a9ece25bd14b288b30c3d71e667d2c', '7ff39608fed04e4bbcc62710b7223966'];
            return domainAware.includes(this.salesChannel.typeId);
        },
        customFieldCriteria(){
            const criteria = new Criteria();
            criteria.addFilter(Criteria.equals('customFieldSet.relations.entityName', 'product'));
            criteria.addFilter(Criteria.equals('active', 1));
            criteria.addAssociation('customFieldSet');
            return criteria;
        },
        ...mapPropertyErrors('salesChannel',
            [
                'name',
                'customerGroupId',
                'marketplaceId',
                'countryId',
                'currencyId',
                'languageId',
                'shippingMethodId',
                'paymentMethodId',
                'navigationCategoryId'
            ])
    },
    watch: {
        isLoading: function (isLoading) {
            if (isLoading === false) {
                this.checkClientState();
                this.getProductMigrationRequestStatus();
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
                this.isSalesChannelEbay = result === 'ebay';
            });
        }
    },
    methods: {
        setCurrentSegment() {
            let currentSegment = this.$refs.segmentDropdown.currentCategorySegment;

            this.salesChannel.productSegment = currentSegment.productSegmentsName;
            this.salesChannel.productType = currentSegment.productTypesName;
        },
        setSalesChannelAttributeValue(attributeName, value) {
            this.salesChannel[attributeName] = value;
        },
        getAssignedProductSegmentAndType() {
            if (this.isSalesChannelAmazon) {
                this.isSegmentLoading = true;
                this.$refs.segmentDropdown.setSegment(
                    this.salesChannel,
                    'productSegment',
                    'productType'
                );
            }
            this.isSegmentLoading = false;
        },
        onGenerateKeys() {
            this.salesChannelService.generateKey().then((response) => {
                this.salesChannel.accessKey = response.accessKey;
            }).catch((error) => {
                this.createNotificationError({
                    title: this.$tc('sw-sales-channel.detail.titleAPIError'),
                    message: this.$tc('sw-sales-channel.detail.messageAPIError')
                });
            });
        },
        onToggleActive() {
            if (this.salesChannel.active) {
                return;
            }

            this.salesChannelRepository
                .get(this.$route.params.id, Context.api)
                .then((entity) => {
                    this.salesChannel.active = false;
                });
        },
        onCloseDeleteModal() {
            this.showDeleteModal = false;
        },
        onConfirmDelete() {
            this.showDeleteModal = false;

            this.$nextTick(() => {
                this.deleteSalesChannel(this.salesChannel.id);
                this.$router.push({name: 'sw.dashboard.index'});
            });
        },
        deleteSalesChannel(salesChannelId) {
            this.salesChannelRepository.delete(salesChannelId, Context.api).then(() => {
                this.$root.$emit('sales-channel-change');
            });
        },
        checkClientState() {
            this.timedClientStateCheck();
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
                    this.connectionAssistantBtnStartDisabled = true;
                } else {
                    clearInterval(this.intervalId);
                    this.connectionAssistantBtnStartDisabled = false;
                    this.sendSystemData();
                    this.sendErpSystemMatching();
                }

                this.BfSalesChannelService.getIsMarketplaceConnected().then((isConnected) => {
                    this.buildConnectionAssistantRouterLink()
                    this.isConnected = isConnected;
                    this.showNotificationBox = true;
                    this.isLoadingBaseData = false;
                });

                this.getAssignedProductSegmentAndType();
            }).catch((error) => {
                this.isLoadingBaseData = false;
                this.bfBpUnauthorized = true;
            })
        },
        isSalesChannelActivationSwitchEnabled() {
            if (this.salesChannel) {

                // all active saleschannels can be deactivated
                if (this.salesChannel.active) {
                    return true;
                }

                if (this.isConnected && this.clientExists && !this.clientInProgress && !this.productMigrationRequest) {
                    if (this.isSalesChannelEbay) {
                        return this.salesChannel.shippingPolicy
                            && this.salesChannel.paymentPolicy
                            && this.salesChannel.returnPolicy
                            && !this.salesChannel.noPaymentMethodMatching;
                    }

                    // here will come only amazon saleschannel
                    return true;
                }
            }

            return false;
        },
        async buildConnectionAssistantRouterLink() {
            const salesChannelType = await this.BfSalesChannelService.getSalesChannelType();
            let marketplaceId = await this.BfSalesChannelService.getMarketplaceId(salesChannelType);

            this.connectionAssistantRouterLink = {
                name: 'bf.sales.channel.detail.base.' + salesChannelType + 'ConnectionAssistant.start.authorize',
                params: {
                    marketplaceId: marketplaceId
                }
            };
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
                API_URL: window.location.origin + '/sales-channel-api/',
                SHOPWARE_SALES_CHANNEL_ID: this.salesChannel.id,
                SHOPWARE_SALES_CHANNEL_KEY: this.salesChannel.accessKey,
                DEFAULT_DELIVERY_TIMES: this.salesChannel.processingTime
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
            } else if (await this.BfSalesChannelService.getSalesChannelType() === 'ebay') {
                await this.BfEbayService.storeErpSystemMatchingData(this.BfSalesChannelService, this.salesChannel);
            }

            await this.BfSalesChannelService.storeErpSystemsConfigurationCurrenciesMatching(
                await this.BfSalesChannelService.getSelectedCurrencyEntity(this.salesChannel.currencyId));

            await this.BfSalesChannelService.storeErpSystemsConfigurationLanguagesMatching(
                await this.BfSalesChannelService.getSelectedLanguagesEntity(this.salesChannel.languageId));
        },
        closeLoginModal() {
            this.showLoginModal = false;
            this.getContract();
        },
        handleSbpError(error) {
            if (error.response === undefined) {
                this.userAuthorised = false;
            } else {
                let errorResponse = error.response.data;

                this.createNotificationError({
                    title: errorResponse.title,
                    message: errorResponse.description
                });
            }
        },
        onSetNewContract(contract) {
            this.currentContract = contract;
            this.clientExists = true;
        },
        onCancelContract() {
            this.currentContract = {};
            this.clientExists = false;
        },
        getContract() {
            return this.bfContractService.getUserInformation('user-token')
                .then((response) => {
                    if (response.longLifeToken === null || response.shopSecret === null) {
                        this.userAuthorised = false;
                        return response;
                    } else {
                        return this.getContractDetails();
                    }
                });
        },
        getProductMigrationRequestStatus() {
            this.BfSalesChannelService.setSalesChannelId(this.$route.params.id);
            return this.BfSalesChannelService.getSalesChannelConfiguration().then((configuration) => {
                this.productMigrationRequest = configuration.product_migration_request;
            });
        },
        getContractDetails() {
            return this.bfContractService.getContracts()
                .then((contracts) => {
                    if (contracts.current !== null) {
                        this.currentContract = contracts.current;
                    }

                    this.userAuthorised = contracts.bookable !== undefined;
                    this.bookableContracts = contracts.bookable;
                    this.subProcessorData = contracts.subprocessors;

                    return contracts;
                })
                .catch((error) => {
                    this.handleSbpError(error);
                });
        },
        setPolicy(policyName, profileId) {
            this.$emit('setPolicy', policyName, profileId)
        }
    },
    created() {
        this.BfSalesChannelService.setSalesChannelId(this.$route.params.id);
        this.getContract();

        //Need only to check client when route is not create
        if (this.salesChannel !== null && this.$route.name !== 'bf.sales.channel.create.base') {
            this.getProductMigrationRequestStatus();
            this.checkClientState();
        } else if (this.$route.name === 'bf.sales.channel.create.base') {
            this.creatingNewSalesChannel = true;
            this.isLoadingBaseData = false;
            // resolve initially for the sales channel creation as well
            Promise.resolve(this.salesChannelType).then((result) => {
                this.isSalesChannelAmazon = result === 'amazon';
                this.isSalesChannelEbay = result === 'ebay';
            });
        }
    }
})
