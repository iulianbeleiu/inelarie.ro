import template from './bf-sales-channel-detail-unit-mapping.html.twig';

const {Component, State} = Shopware;

Component.register('bf-sales-channel-detail-unit-mapping', {
    template,
    inject: [
        'bfUnitService'
    ],
    data() {
        return {
            units: null,
            unitMappings: null,
            sortBy: 'name',
            isLoading: false,
            sortDirection: 'ASC'
        };
    },
    computed: {
        columns() {
            return this.getColumns();
        },
        currentLocale() {
            return State.get('session').currentLocale;
        }
    },
    created() {
        this.bfUnitService.setSalesChannelId(this.$route.params.id);
        this.getList('*');
    },
    methods: {
        getColumns() {
            return [
                {
                    property: 'unitsDescription.' + this.currentLocale + '.unitsName',
                    label: 'unitMapping.column.name',
                    primary: true
                },
                {
                    property: 'external_name',
                    label: 'unitMapping.column.externalName'
                }
            ];
        },
        getList(name) {
            this.isLoading = true;

            this.bfUnitService.loadUnitMappingData().then((response) => {
                this.unitMappings = response.data;

                this.bfUnitService.loadUnitData(name).then((response) => {
                    this.units = response.data;

                    this.isLoading = false;
                }).catch(() => {
                    this.isLoading = false;
                });
            })
        }
    }
});
