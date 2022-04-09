import template from './custom-fields-mapping.html.twig';
import '../component/utils';

const {Component, Context} = Shopware;
const {Criteria} = Shopware.Data;

Component.register('custom-fields-mapping', {
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
            isLoadingCustomFieldsMapping: false,
            showEmptyState: false,
            page: 1,
            limit: 5,
            total: 0,
            sortBy: 'name',
            sortDirection: 'ASC',
            customFieldsMapping: [],
            swagMarketsErpSystemsAttributesMappingData: {},
            swagMarketsAttributesMappingData: {},
            toRemoveAssignmentIem: null,
            showDeleteModalCustomFieldsAttributesMapping: false,
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
        customFieldsRepository() {
            return this.repositoryFactory.create('custom_field');
        },
        useNaturalSorting() {
            return this.sortBy === 'property.swCustomFields';
        },
    },
    methods: {
        async loadComponent() {
            this.isLoadingCustomFieldsMapping = true;
            this.swagMarketsErpSystemsAttributesMappingData = await this.AttributesMappingUtils.getMappedErpSystemsList(
                await this.bfPropertyService.loadPropertyData(), 'CUSTOM_FIELDS_TO_IMPORT_AS_ATTRIBUTES');
            await this.loadSwagMarketsAttributesMapping();
            await this.loadCustomFieldsMappingData();
            this.isLoadingCustomFieldsMapping = false;
        },
        async loadSwagMarketsAttributesMapping() {
            this.swagMarketsAttributesMappingData = await this.AttributesMappingUtils.loadSwagMarketsAttributesMapping(this.bfPropertyService);
        },
        async loadCustomFieldsMappingData() {
            let me = this, criteria = new Criteria(this.page, this.limit),
                mapping = [];

            criteria.addSorting(Criteria.sort(this.sortBy, this.sortDirection, this.useNaturalSorting));
            await this.customFieldsRepository.search(criteria, Context.api).then((entityCollection) => {
                this.total = entityCollection.total;
                if (entityCollection.length > 0) {
                    entityCollection.forEach(function (entity) {
                        let translations = [], swagMarketsAttributeName = '', swagMarketsMappingId = null,
                            assigned = false;
                        for (const [key, value] of Object.entries(entity.config.label)) {
                            translations.push({
                                isoCode: `${key}`.split('-')[0],
                                name: `${value}`
                            })
                        }
                        if (me.swagMarketsErpSystemsAttributesMappingData !== null && me.swagMarketsErpSystemsAttributesMappingData.length > 0) {
                            if (me.swagMarketsAttributesMappingData.length > 0) {
                                me.swagMarketsAttributesMappingData.forEach(function (mappingData) {

                                    if (entity.name === mappingData.internalValue) {
                                        swagMarketsAttributeName = mappingData.externalValue;
                                        swagMarketsMappingId = mappingData.bfMappingId;
                                        assigned = true;
                                    }
                                });
                            }
                        }

                        mapping.push({
                            id: entity.id,
                            swCustomFields: entity.name,
                            swagMarketsAttributeName: swagMarketsAttributeName,
                            translations: translations,
                            swagMarketsMappingId: swagMarketsMappingId,
                            assigned: assigned
                        });

                    });
                }
            });

            this.customFieldsMapping = mapping;
            if (this.customFieldsMapping.length === 0) {
                this.showEmptyState = true;
            }
        },
        saveInlineEdit(item) {
            this.isLoadingPropertiesMapping = true;
            this.saveErpConfiguration(item);
            this.upsertAndGetProductsAttributes(item);
        },
        /**
         * @param item
         */
        saveErpConfiguration(item) {
            this.swagMarketsErpSystemsAttributesMappingData = this.AttributesMappingUtils.saveInlineEdit(
                item, this.swagMarketsErpSystemsAttributesMappingData, 'swCustomFields');

            this.AttributesMappingUtils.transferErpSystemsConfigurations(
                this.bfPropertyService, this.swagMarketsErpSystemsAttributesMappingData, 'custom_field');
        },
        /**
         * @param item
         */
        async upsertAndGetProductsAttributes(item) {
            let productsAttributesId = await this.AttributesMappingUtils.upsertProductsAttributesResource(
                item.swCustomFields,
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
                item.swCustomFields,
                item.swagMarketsMappingId
            ).then(() => {
                this.loadComponent();
            });
        },
        /**
         * @param param
         */
        pageChange(param) {
            this.page = param.page;
            this.limit = param.limit;
            this.loadComponent();
        },
        showRemoveAssignmentModal(item) {
            this.toRemoveAssignmentIem = item;
            this.showDeleteModalCustomFieldsAttributesMapping = true;
        },
        closeRemoveAssignmentModal() {
            this.showDeleteModalCustomFieldsAttributesMapping = false;
        },
        async removeCustomFieldsAssignment() {
            await this.AttributesMappingUtils.removeAttributesMappingAssignment(
                this.bfPropertyService,
                this.toRemoveAssignmentIem
            ).then(() => {
                this.showDeleteModalCustomFieldsAttributesMapping = false;
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
                    property: 'swCustomFields',
                    label: this.$tc('attributesMapping.custom-fields.columnName'),
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
