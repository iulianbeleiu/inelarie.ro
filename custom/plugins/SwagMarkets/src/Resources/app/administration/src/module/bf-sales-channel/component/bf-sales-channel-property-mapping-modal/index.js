import template from './bf-sales-channel-property-mapping-modal.html.twig';

const {Component, Mixin} = Shopware;

Component.register('bf-sales-channel-property-mapping-modal', {
    template,
    inject: [
        'bfPropertyService'
    ],
    mixins: [
        Mixin.getByName('notification')
    ],
    props: {
        title: {
            type: String,
            required: true
        },
        property: {
            type: Object,
            required: true
        },
        bfAttributeMappingData: {
            type: Object
        }
    },
    data() {
        return {
            isLoading: false,
            externalName: null,
            searchString: '',
            attributeData: [],
            columns: [
                {
                    property: 'id',
                    visible: false,
                    primary: true
                },
                {
                    property: 'name',
                    label: 'propertyMapping.columns.name'
                }
            ]
        }
    },
    created() {
        this.componentCreated();
    },
    methods: {
        componentCreated() {
            this.loadAttributeData();
        },
        getBfMappingId() {
            if (this.bfAttributeMappingData !== null) {
                return this.bfAttributeMappingData.bfMappingId;
            }

            return null;
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

            this.bfPropertyService.saveAttributeMappingData({
                bfMappingId: this.getBfMappingId(),
                attributeId: this.property.productsAttributesCode,
                externalValue: Object.values(this.$refs['attributeGrid'].selection)[0].name
            }).then(() => {
                this.$emit('modal-close');

                this.createNotificationSuccess({
                    title: this.$tc('propertyMapping.notifications.title.success'),
                    message: this.$tc('propertyMapping.notifications.message.success')
                });
            }).catch(() => {
                this.$emit('modal-close');

                this.createNotificationError({
                    title: this.$tc('propertyMapping.notifications.title.error'),
                    message: this.$tc('propertyMapping.notifications.message.error')
                });
            });
        },
        loadAttributeData() {
            this.isLoading = true;

            this.bfPropertyService.loadAttributeData(this.searchString).then((response) => {
                this.attributeData = this.getUniqueValues(response.data);

                this.isLoading = false;
            });
        },
        getUniqueValues(data) {
            return data.filter((value, index, allElements) => {
                return allElements.findIndex(element => (element.id === value.id)) === index;
            });
        },
        sortList() {
            // ToDo: add logic
        }
    }
});
