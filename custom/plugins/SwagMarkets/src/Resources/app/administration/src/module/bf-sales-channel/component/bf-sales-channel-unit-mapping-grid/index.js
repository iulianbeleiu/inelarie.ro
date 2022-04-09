import template from './bf-sales-channel-unit-mapping-grid.html.twig';

const {Component, State} = Shopware;

Component.extend('bf-sales-channel-unit-mapping-grid', 'sw-data-grid', {
    template,
    props: {
        unitMappings: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            selectedUnit: null,
            showUnitMappingModal: false
        }
    },
    computed: {
        currentLocale() {
            return State.get('session').currentLocale;
        }
    },
    methods: {
        getCurrentData(item) {
            let currentData = {};

            this.unitMappings.forEach(function (unitMapping) {
                if (unitMapping.internalValue !== null && unitMapping.internalValue.toLowerCase() === item.externUnitsId.toLowerCase()) {
                    currentData = unitMapping;
                }
            });

            return currentData;
        },
        getExternalName(item) {
            let externalName = '';

            this.unitMappings.forEach(function (unitMapping) {
                if (unitMapping.internalValue !== null && unitMapping.internalValue.toLowerCase() === item.externUnitsId.toLowerCase()) {
                    externalName = unitMapping.externalValue;
                }
            });

            return externalName;
        },
        onEditUnitMappingClick(item) {
            this.selectedUnit = item;
            this.showUnitMappingModal = true;
        }
    }
});
