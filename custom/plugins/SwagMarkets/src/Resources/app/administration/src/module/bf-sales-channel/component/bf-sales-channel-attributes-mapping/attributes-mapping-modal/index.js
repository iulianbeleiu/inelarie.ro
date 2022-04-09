import template from './attributes-mapping-modal.html.twig';

const {Component, Mixin} = Shopware;

Component.register('attributes-mapping-modal', {
    template,

    inject: [
        'bfPropertyService',
        'BfAmazonService'
    ],
    mixins: [
        Mixin.getByName('notification')
    ],
    props: {
        showAttributesMappingModal: {
            type: Boolean,
            default: false
        },
        attributesMappingModalItem: {
            type: Object,
            default() {
                return {}
            },
            required: true
        },
        salesChannelType: {
            type: String,
            required: true
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
    watch: {
        showAttributesMappingModal: function (newVal, oldVal) {
            if (newVal === true) {
                this.loadComponent();
            }
        }
    },
    created() {
        this.loadComponent()
    },
    data() {
        return {
            searchString: '',
            attributeData: [],
            isLoading: false,
            limit: 10,
            page: 1,
            total: 0
        }
    },
    computed: {
        columns() {
            return this.getColumns();
        },
    },
    methods: {
        loadComponent() {
            this.loadAttributeData();

        },
        async loadAttributeData() {
            this.isLoading = true;
            await this.bfPropertyService.loadAttributeData(this.searchString, this.limit, this.page).then((response) => {
                this.total = response.totalCount;
                this.attributeData = response.data;

                if (this.salesChannelType === 'amazon' && this.amazonSegment.length > 0 && this.amazonProductType.length > 0) {
                    this.BfAmazonService.getAmazonSegmentByName(this.amazonSegment).then((response) => {
                        if (response.success && response.data.length > 0) {
                            this.BfAmazonService.getProductTypesIdByProductTypesName(this.amazonProductType, response.data[0].id, response.data[0].name).then((response) => {
                                if (response.success && response.data.length > 0) {
                                    this.BfAmazonService.getProductTypesAttributesByProductType(response.data[0].id, this.limit, this.page, this.searchString).then((response) => {
                                        if (response.success) {
                                            this.total = response.totalCount;
                                            this.attributeData = response.data;
                                        }
                                    });
                                }
                            });
                        }
                    });
                }

                this.isLoading = false;
            });
        },
        saveData() {
            if (this.$refs['attributeGrid'].selectionCount > 1) {
                this.createNotificationWarning({
                    title: this.$tc('propertyMapping.notifications.title.warning'),
                    message: this.$tc('propertyMapping.notifications.message.warningTooManySelected')
                });

                return;
            }

            if (this.$refs['attributeGrid'].selectionCount === 0) {
                this.createNotificationWarning({
                    title: this.$tc('propertyMapping.notifications.title.warning'),
                    message: this.$tc('propertyMapping.notifications.message.warningNoSelection')
                });

                return;
            }

            this.attributesMappingModalItem.swagMarketsAttributeName = Object.values(this.$refs['attributeGrid'].selection)[0].name;
            this.$emit('save-attribute-mapping', this.attributesMappingModalItem);
            this.$emit('modal-close-attr-mapping-win');
        },
        pageChange(params) {
            this.page = params.page;
            this.limit = params.limit;
            this.loadComponent();
        },
        getColumns() {
            return [
                {
                    property: 'id',
                    visible: false,
                    primary: true
                },
                {
                    property: 'name',
                    label: this.getMarketplaceColumnsHeader()
                },
                {
                    property: 'mandatory',
                    label: this.$tc('attributesMapping.mandatory'),
                    width: "100px"
                }
            ]
        },
        getMarketplaceColumnsHeader() {
            return this.salesChannelType === 'amazon' ?
                this.$tc('attributesMapping.amazonColumnName') : this.$tc('attributesMapping.ebayColumnName');
        }

    }
});
