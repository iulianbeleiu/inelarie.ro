import template from './properties-mapping.html.twig';
import '../component/utils';
import '../attributes-mapping-modal';

const {Component, Context} = Shopware;
const {Criteria} = Shopware.Data;

Component.register('properties-mapping', {
    template,

    inject: [
        'repositoryFactory',
        'bfPropertyService',
        'AttributesMappingUtils'
    ],

    props: {
        salesChannelType: {
            type: String,
            default: ''
        },
        amazonSegment: {
            type: String,
            default: ''
        },
        amazonProductType: {
            type: String,
            default: ''
        }
    },

    data() {
        return {
            propertiesMapping: [],
            isLoadingPropertiesMapping: true,
            page: 1,
            limit: 5,
            total: 0,
            sortBy: 'name',
            sortDirection: 'ASC',
            showEmptyState: false,
            swagMarketsAttributesMappingData: {},
            swagMarketsErpSystemsAttributesMappingData: {},
            showDeleteModalPropertiesAttributesMapping: false,
            toRemoveAssignmentIem: null,
            showAttributesMappingModal: false,
            attributesMappingModalItem: {}
        }
    },
    created() {
        this.bfPropertyService.setSalesChannelId(this.$route.params.id);
        this.loadComponent();
    },
    computed: {
        columns() {
            return this.getColumns();
        },
        propertyGroupRepository() {
            return this.repositoryFactory.create('property_group');
        },
        useNaturalSorting() {
            return this.sortBy === 'property.swProperty';
        },
    },
    methods: {
        async loadComponent() {
            this.isLoadingPropertiesMapping = true;
            this.swagMarketsErpSystemsAttributesMappingData = await this.AttributesMappingUtils.getMappedErpSystemsList(
                await this.bfPropertyService.loadPropertyData());
            await this.loadSwagMarketsAttributesMapping();
            await this.loadPropertiesMappingData();
            this.isLoadingPropertiesMapping = false;
        },
        /**
         * @returns {Promise<void>}
         */
        async loadSwagMarketsAttributesMapping() {
            this.swagMarketsAttributesMappingData = await this.AttributesMappingUtils.loadSwagMarketsAttributesMapping(this.bfPropertyService);
        },
        /**
         * @returns {Promise<void>}
         */
        async loadPropertiesMappingData() {
            let me = this, criteria = new Criteria(this.page, this.limit),
                mapping = [];

            criteria.addSorting(Criteria.sort(this.sortBy, this.sortDirection, this.useNaturalSorting));
            criteria.addAssociation('translations.language.locale');

            await this.propertyGroupRepository.search(criteria, Context.api).then((entityCollection) => {
                this.total = entityCollection.total;
                if (entityCollection.length > 0) {
                    entityCollection.forEach(function (entity) {
                        let translations = [], swagMarketsAttributeName = '', swagMarketsMappingId = null, assigned = false;
                        entity.translations.forEach(function(entityTranslations) {
                            translations.push({
                                isoCode: entityTranslations.language.locale.code.split('-')[0],
                                name: entityTranslations.name
                            });
                        });

                        if (me.swagMarketsErpSystemsAttributesMappingData !== null && me.swagMarketsErpSystemsAttributesMappingData.length > 0) {
                            if (me.swagMarketsAttributesMappingData.length > 0) {
                                me.swagMarketsAttributesMappingData.forEach(function(mappingData) {
                                    if (entity.id === mappingData.internalValue) {
                                        swagMarketsAttributeName = mappingData.externalValue;
                                        swagMarketsMappingId = mappingData.bfMappingId;
                                        assigned = true;
                                    }
                                });
                            }
                        }

                        mapping.push({
                            id: entity.id,
                            swProperty: entity.name,
                            swagMarketsAttributeName: swagMarketsAttributeName,
                            translations: translations,
                            swagMarketsMappingId: swagMarketsMappingId,
                            assigned: assigned
                        });
                    });
                }
            });

            this.propertiesMapping = mapping;

            if (this.propertiesMapping.length === 0) {
                this.showEmptyState = true;
            }
        },
        /**
         *
         * @param item
         */
        saveInlineEdit(item) {
            this.isLoadingPropertiesMapping = true;
            this.saveErpConfiguration(item);
            this.upsertAndGetProductsAttributes(item);
        },
        /**
         * @param item
         */
        async saveErpConfiguration(item) {
            this.swagMarketsErpSystemsAttributesMappingData = await this.AttributesMappingUtils.saveInlineEdit(
                item, this.swagMarketsErpSystemsAttributesMappingData);

            this.AttributesMappingUtils.transferErpSystemsConfigurations(
                this.bfPropertyService, this.swagMarketsErpSystemsAttributesMappingData, 'property');
        },
        /**
         * @param item
         */
        async upsertAndGetProductsAttributes(item) {
            let productsAttributesId = await this.AttributesMappingUtils.upsertProductsAttributesResource(
                item.id,
                item.translations,
                this.bfPropertyService
            );
            if (productsAttributesId > 0) {
                await this.upsertProductsAttributesMapping(item);
            }
        },
        /**
         * @param item
         */
        async upsertProductsAttributesMapping(item) {
            await this.AttributesMappingUtils.upsertProductsAttributesMappingResource(
                this.bfPropertyService,
                item.swagMarketsAttributeName,
                item.id,
                item.swagMarketsMappingId
            ).then(() => {
                this.loadComponent();
            });
        },
        pageChange(param) {
            this.page = param.page;
            this.limit = param.limit;
            this.loadComponent();
        },
        showRemoveAssignmentModal(item) {
            this.toRemoveAssignmentIem = item;
             this.showDeleteModalPropertiesAttributesMapping = true;
        },
        closeRemoveAssignmentModal() {
            this.showDeleteModalPropertiesAttributesMapping = false;
        },
        async removePropertiesAssignment() {
            await this.AttributesMappingUtils.removeAttributesMappingAssignment(
                this.bfPropertyService,
                this.toRemoveAssignmentIem
            ).then(() => {
                this.showDeleteModalPropertiesAttributesMapping = false;
                this.loadComponent();
            });
        },
        showAttributesMappingModalWindow(item) {
            this.attributesMappingModalItem = item;
            this.showAttributesMappingModal = true;
        },
        closeAttributesMappingModalWindow() {
            this.attributesMappingModalItem = {};
            this.showAttributesMappingModal = false;
        },
        /**
         * @returns {({property: string, width: string, label: string, rawData: boolean}|{property: string, inlineEdit: string, label: string, rawData: boolean})[]}
         */
        getColumns() {
            return [
                {
                    property: 'swProperty',
                    label: this.$tc('attributesMapping.properties.columnName'),
                    rawData: true,
                    width: '400px'
                },
                {
                    property: 'swagMarketsAttributeName',
                    label: this.getMarketplaceColumnsHeader(),
                    rawData: true,
                    inlineEdit: 'string'
                },
                {
                    property: 'assigned',
                    label: this.$tc('attributesMapping.assigned'),
                    rawData: true,
                }
            ]
        },
        getMarketplaceColumnsHeader() {
            return this.salesChannelType === 'amazon' ?
                this.$tc('attributesMapping.amazonColumnName') : this.$tc('attributesMapping.ebayColumnName');
        }
    }
});
