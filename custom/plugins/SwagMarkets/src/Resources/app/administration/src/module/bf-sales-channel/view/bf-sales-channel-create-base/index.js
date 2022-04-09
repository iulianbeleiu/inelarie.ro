import template from './bf-sales-channel-create-base.html.twig';

const {Component} = Shopware;
const {Criteria} = Shopware.Data;

Component.extend('bf-sales-channel-create-base', 'bf-sales-channel-detail-base', {
    template,
    inject: [
        'repositoryFactory',
        'BfSalesChannelService'
    ],
    data() {
        return {
            marketplaceSettings: null,
            marketplaces: [],
            countries: [],
            currencies: [],
            languages: [],

        }
    },
    created() {
        this.createdComponent();
    },
    computed: {
        marketplaceSettingsRepository() {
            return this.repositoryFactory.create('bf_marketplace_settings');
        },
        marketplaceRepository() {
            return this.repositoryFactory.create('bf_marketplace');
        },
        salesChannelType() {
            return this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId)
        }
    },
    methods: {
        createdComponent() {
            this.onGenerateKeys()

            const criteria = new Criteria();
            criteria.addFilter(Criteria.equals('type', this.salesChannelType));

            this.BfSalesChannelService.getMarketplaces(this.salesChannelType)
                .then((marketplaces) => {
                    marketplaces.forEach((marketplace) => {
                        this.marketplaces.push({
                            value: marketplace.channel_specific_id,
                            label: marketplace.name
                        });
                    });
                }).catch((error) => {
                    console.log(error);
            });
        },
        onUpdateMarketplace(marketplaceId) {},
        resetAssociationEntities() {
            this.languages = [];
            this.currencies = [];
            this.countries = [];
        }
    }
});
