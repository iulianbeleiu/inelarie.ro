import template from './bf-sales-channel-property-mapping-list.html.twig';

const {Component, State} = Shopware;

Component.extend('bf-sales-channel-property-mapping-list', 'sw-data-grid', {
    template,
    props: {
        attributeMappingData: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            showPropertyMappingModal: false,
            selectedProperty: null
        };
    },
    computed: {
        currentLocale() {
            return State.get('session').currentLocale;
        }
    },
    methods: {
        getBfAttributeMappingData() {
            for (const attributeMapping of this.attributeMappingData) {
                if (attributeMapping.internalValue !== null && attributeMapping.internalValue.toLowerCase() === this.selectedProperty.productsAttributesCode.toLowerCase()) {
                    return attributeMapping;
                }
            }

            return null;
        },
        getExternalName(item) {
            for (const attributeMapping of this.attributeMappingData) {
                if (attributeMapping.internalValue !== null && attributeMapping.internalValue.toLowerCase() === item.productsAttributesCode.toLowerCase()) {
                    return attributeMapping.externalValue;
                }
            }

            return '';
        },
        onEditPropertyMappingClick(item) {
            this.showPropertyMappingModal = true;
            this.selectedProperty = item;
        }
    }
});
