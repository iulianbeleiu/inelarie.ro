import template from './bf-sales-channel-segment-mapping.html.twig';
import './bf-sales-channel-segment-mapping.scss';

import '../bf-sales-channel-shopware-segment-dropdown';

const {Component, Context} = Shopware;
const {Criteria} = Shopware.Data;

Component.register('bf-sales-channel-segment-mapping', {
    template,
    inject: [
        'repositoryFactory',
        'BfCategoryService',
        'bfContractService',
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
            required: false,
            default: ''
        }
    },
    data() {
        return {
            isSegmentLoading: false,
            salesChannel: null,
            marketplaceName: '',
            activeCategoryId: ''
        }
    },
    created() {
        this.getSalesChannelInfo();
    },
    computed: {
        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        }
    },
    methods: {
        getSalesChannelInfo() {
            this.isLoading = true;

            this.salesChannelRepository
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
        setCurrentCategorySegment() {
            let mapObject = this.$refs.segmentDropdown.currentCategorySegment;
            mapObject.categoryId = this.activeCategoryId;

            localStorage.setItem('productSegment', JSON.stringify(mapObject));
        },
        onSelectCategory(item) {
            this.isSegmentLoading = true;
            this.activeCategoryId = item;

            this.BfCategoryService.getCategorySegment(this.activeCategoryId)
                .then((response) => {
                    this.$refs.segmentDropdown.setSegment(response, 'productSegmentsName', 'productTypesName');
                    this.setCurrentCategorySegment();

                    this.isSegmentLoading = false;
                })
                .catch((error) => {
                    console.log(error);

                    this.isSegmentLoading = false;
                });
        }
    }
});
