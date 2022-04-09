import template from './bf-sales-channel-unit-mapping-modal.html.twig';

const {Component, Mixin} = Shopware;

Component.register('bf-sales-channel-unit-mapping-modal', {
    template,
    inject: [
        'bfUnitService'
    ],
    mixins: [
        Mixin.getByName('notification')
    ],
    props: {
        unit: {
            type: Object,
            required: true
        },
        currentData: {
            type: Object,
            required: true
        },
        title: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            columns: [],
            unitData: [],
            amazonColumns: [
                {
                    property: 'type',
                    label: 'unitMapping.column.type'
                },
                {
                    property: 'name',
                    label: 'unitMapping.column.name'
                }
            ],
            amazonUnitData: [
                {id: 1, type: 'weight', name: 'GR'},
                {id: 2, type: 'weight', name: 'KG'},
                {id: 3, type: 'weight', name: 'OZ'},
                {id: 4, type: 'weight', name: 'LB'},
                {id: 5, type: 'weight', name: 'MG'},

                {id: 6, type: 'volume', name: 'cubic-cm'},
                {id: 7, type: 'volume', name: 'cubic-ft'},
                {id: 8, type: 'volume', name: 'cubic-in'},
                {id: 9, type: 'volume', name: 'cubic-m'},
                {id: 10, type: 'volume', name: 'cubic-yd'},
                {id: 11, type: 'volume', name: 'cup'},
                {id: 12, type: 'volume', name: 'fluid-oz'},
                {id: 13, type: 'volume', name: 'gallon'},
                {id: 14, type: 'volume', name: 'liter'},
                {id: 15, type: 'volume', name: 'milliliter'},
                {id: 16, type: 'volume', name: 'ounce'},
                {id: 17, type: 'volume', name: 'pint'},
                {id: 18, type: 'volume', name: 'quart'},
                {id: 19, type: 'volume', name: 'liters'},
                {id: 20, type: 'volume', name: 'deciliters'},
                {id: 21, type: 'volume', name: 'centiliters'},
                {id: 22, type: 'volume', name: 'milliliters'},
                {id: 23, type: 'volume', name: 'microliters'},
                {id: 24, type: 'volume', name: 'nanoliters'},
                {id: 25, type: 'volume', name: 'picoliters'},

                {id: 26, type: 'length', name: 'MM'},
                {id: 27, type: 'length', name: 'CM'},
                {id: 28, type: 'length', name: 'M'},
                {id: 29, type: 'length', name: 'IN'},
                {id: 30, type: 'length', name: 'FT'},
                {id: 31, type: 'length', name: 'inches'},
                {id: 32, type: 'length', name: 'feet'},
                {id: 33, type: 'length', name: 'meters'},
                {id: 34, type: 'length', name: 'decimeters'},
                {id: 35, type: 'length', name: 'centimeters'},
                {id: 36, type: 'length', name: 'millimeters'},
                {id: 37, type: 'length', name: 'micrometers'},
                {id: 38, type: 'length', name: 'nanometers'},
                {id: 39, type: 'length', name: 'picometers'}
            ],
            ebayColumns: [
                {
                    property: 'name',
                    label: 'unitMapping.column.name'
                }
            ],
            ebayUnitData: [
                {id: 1, name: 'Kg'},
                {id: 2, name: '100g'},
                {id: 3, name: '10g'},
                {id: 4, name: 'g'},
                {id: 5, name: 'L'},
                {id: 6, name: '100ml'},
                {id: 7, name: '10ml'},
                {id: 8, name: 'ml'},
                {id: 9, name: 'M'},
                {id: 10, name: 'M2'},
                {id: 11, name: 'M3'},
                {id: 12, name: 'Unit'}
            ]
        }
    },
    computed: {
        gridColumns() {
            return this.columns;
        },
        gridUnitData() {
            return this.unitData;
        }
    },
    created() {
        this.bfUnitService.setSalesChannelId(this.$route.params.id);

        this.isLoading = true;

        this.bfUnitService.getSalesChannelType().then((response) => {
            if (response === 'amazon') {
                this.columns = this.amazonColumns;
                this.unitData = this.amazonUnitData;
            }

            if (response === 'ebay') {
                this.columns = this.ebayColumns;
                this.unitData = this.ebayUnitData;
            }

            this.isLoading = false;
        }).catch(() => {
            this.isLoading = false;
        });
    },
    methods: {
        saveData() {
            if (this.$refs['unitGrid'].selectionCount > 1) {
                this.createNotificationWarning({
                    title: this.$tc('unitMapping.notifications.title.warning'),
                    message: this.$tc('unitMapping.notifications.message.warningTooManySelected')
                })

                return;
            }

            if (this.$refs['unitGrid'].selectionCount === 0) {
                this.createNotificationWarning({
                    title: this.$tc('unitMapping.notifications.title.warning'),
                    message: this.$tc('unitMapping.notifications.message.warningNoSelection')
                });

                return;
            }

            const selection = Object.values(this.$refs['unitGrid'].selection)[0];

            let data = this.currentData;

            data.unitId = this.unit.externUnitsId;
            data.externalValue = selection.name;

            if (selection.hasOwnProperty('type')) {
                data.measure = selection.type;
            }

            this.bfUnitService.saveUnitMappingData(data).then((response) => {
                if (response.success) {
                    this.createNotificationSuccess({
                        title: this.$tc('unitMapping.notifications.title.success'),
                        message: this.$tc('unitMapping.notifications.message.success')
                    })
                } else {
                    this.createNotificationError({
                        title: this.$tc('unitMapping.notifications.title.error'),
                        message: this.$tc('unitMapping.notifications.message.error')
                    })
                }

                this.$emit('modal-close');
            }).catch(() => {
                this.createNotificationError({
                    title: this.$tc('unitMapping.notifications.title.error'),
                    message: this.$tc('unitMapping.notifications.message.error')
                })

                this.$emit('modal-close');
            });
        }
    }
});
