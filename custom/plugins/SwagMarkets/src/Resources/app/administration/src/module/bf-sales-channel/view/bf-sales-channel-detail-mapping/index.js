import template from './bf-sales-channel-detail-mapping.html.twig';
import './bf-sales-channel-detail-mapping.scss';

const {Component, Mixin, State, Context} = Shopware;
const {Criteria} = Shopware.Data;

Component.register('bf-sales-channel-detail-mapping', {
    template,
    inject: [
        'bfContractService',
        'repositoryFactory',
        'BfSalesChannelService'
    ],
    mixins: [
        Mixin.getByName('listing')
    ],
    props: {
        categoriesReloadTriggerEvent: {
            required: false
        }
    },
    data() {
        return {
            clientExists: false,
            clientInProgress: false,
            currentContract: {},
            propertyGroup: null,
            swPropertyGroup: null,
            isLoading: false,
            attributeMappingData: [],
            marketplaceName: '',
            salesChannel: null,
            amazonSegment: '',
            amazonProductType: ''
        };
    },
    watch: {
        '$route.params.id'() {
            this.getSalesChannelInfo();
        }
    },
    computed: {
        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        },
        isAmazon() {
            return this.$attrs.salesChannelType === 'amazon';
        },
        currentLocale() {
            return State.get('session').currentLocale;
        }
    },
    created() {
        this.getContract();
        this.getSalesChannelInfo();
        this.checkClientState();
        this.loadShopsConfigurations();
    },
    methods: {
        async getSalesChannelInfo() {
            this.isLoading = true;

            await this.salesChannelRepository
                .get(this.$route.params.id, Context.api, new Criteria())
                .then((entity) => {
                    this.salesChannel = entity;
                    this.marketplaceName = this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId);
                    this.isLoading = false;
                })
                .catch(() => {
                    this.isLoading = false;
                });
        },
        getContract() {
            return this.bfContractService.getUserInformation('user-token')
                .then((response) => {
                    if (response.longLifeToken === null || response.shopSecret === null) {
                        return response;
                    } else {
                        return this.getContractDetails();
                    }
                });
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
        checkClientState() {
            this.BfSalesChannelService.checkClientState().then((response) => {
                this.clientExists = response.clientExists;
                this.clientInProgress = response.clientInProgress;
            })
        },
        async loadShopsConfigurations() {
            await this.BfSalesChannelService.getShopsConfigurations().then((response) => {
                let shopsConfigurations = response.data.data;
                this.amazonSegment = shopsConfigurations.hasOwnProperty('productSegment') ? shopsConfigurations.productSegment : '-';
                this.amazonProductType = shopsConfigurations.hasOwnProperty('productType') ? shopsConfigurations.productType : '-';
            }).catch((error) => {
                this.isLoading = false;
            });
        }
    }
});
