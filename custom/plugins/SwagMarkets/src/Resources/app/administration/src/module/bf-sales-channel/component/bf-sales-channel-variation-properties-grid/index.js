import template from './bf-sales-channel-variation-properties-grid.html.twig';

const {Component, Context} = Shopware;
const {Criteria} = Shopware.Data;

Component.register('bf-sales-channel-variation-properties-grid', {
    template,
    inject: [
        'bfPropertyService',
        'BfSalesChannelService',
        'repositoryFactory',
    ],
    data() {
        return {
            variationProperties: [],
            gridColumns: [],
            showActions: true,
            showEmptyStateVariationProperties: false,
            isLoading: false,
            total: 0,
            limit: 5,
            page: 1
        }
    },

    computed: {
        propertyRepository() {
            return this.repositoryFactory.create('property_group');
        },
        getColumns() {
            return [
                {
                    property: 'name',
                    label: this.$tc('propertyMapping.variationProperties.swLabel'),
                    dataIndex: 'name'
                },
                {
                    property: 'selectedVariation',
                    dataIndex: 'selectedVariation',
                    label: this.$tc('propertyMapping.variationProperties.amazonLabel'),
                    inlineEdit: 'string'
                },
                {
                    property: 'bfMappingId',
                    dataIndex: 'bfMappingId',
                    label: '',
                    visible: false
                }
            ];
        }

    },
    created() {
        this.loadComponent();
    },
    methods: {
        async loadComponent() {
            this.isLoading = true;
            this.bfPropertyService.setSalesChannelId(this.$route.params.id)
            await this.getVariationProperties()

            if (this.variationProperties.length === 0) {
                this.showEmptyState = true;
            }
            this.isLoading = false;
        },
        async getVariationProperties() {
            let me = this,
                variationPropertiesIds = [],
                mappedVariationsProperties = [];

            await this.bfPropertyService.getVariationsDiffsOptionsMapping(await this.bfPropertyService.getSalesChannelType()).then((response) => {
                if (response.success) {
                    response.data.forEach(function (item) {
                        mappedVariationsProperties.push(item);
                    })
                }
            });

            await this.bfPropertyService.getVariationProperties(this.page, this.limit)
                .then(async (response) => {
                    if (response.success) {
                        this.total = response.data.totalCount;
                        response.data.data.forEach(function (item) {
                            variationPropertiesIds.push([item.externProductsVariationsDiffsOptionsId]);
                        });

                        if (variationPropertiesIds.length > 0) {
                            let criteria = new Criteria();
                            criteria.addFilter(Criteria.equalsAny('id', variationPropertiesIds));

                            await this.propertyRepository.search(criteria, Context.api).then((entityCollection) => {
                                if (entityCollection.length > 0) {
                                    entityCollection.forEach(function (entity) {
                                        let mappedInformation = me.getMappedInformation(mappedVariationsProperties, entity);
                                        me.variationProperties.push({
                                            id: entity.id,
                                            name: entity.translated.name,
                                            selectedVariation: mappedInformation.selectedVariation,
                                            bfMappingId: mappedInformation.bfMappingId
                                        });
                                    });
                                }
                            });
                        }
                    }
                }).catch((error) => {
                    console.log(error);
                });
        },
        /**
         *
         * @param mappedVariationsProperties
         * @param entity
         * @returns {{selectedVariation: string, bfMappingId: string}}
         */
        getMappedInformation(mappedVariationsProperties = Array, entity = {}) {
            let mappedInformation = {selectedVariation: '', bfMappingId: ''};

            if (mappedVariationsProperties.length > 0) {
                for (let i = 0; i < mappedVariationsProperties.length; i++) {
                    if (mappedVariationsProperties[i].internalValue === entity.id) {
                        mappedInformation.selectedVariation = mappedVariationsProperties[i].externalValue;
                        mappedInformation.bfMappingId = mappedVariationsProperties[i].bfMappingId;
                        break;
                    }
                }
            }

            return mappedInformation;
        },
        async onInlineEditSave(item) {
            if (item.bfMappingId.length === 0){
                item.bfMappingId = null;
            }

            this.bfPropertyService.storeVariationsDiffsOptionsMapping(
                await this.BfSalesChannelService.getSalesChannelType(),
                {
                    bfMappingId: item.bfMappingId,
                    propertyId: item.id,
                    externalValue: item.selectedVariation
                }
            )
        },
        pageChange(params) {
            this.page = params.page;
            this.limit = params.limit;
            this.variationProperties = [];
            this.loadComponent();
        },
        onDbClickCell(item) {
        },
        onEditCellValue(item) {
            this.$root.$emit('onDbClickCell', item.id);
        }
    }
})
