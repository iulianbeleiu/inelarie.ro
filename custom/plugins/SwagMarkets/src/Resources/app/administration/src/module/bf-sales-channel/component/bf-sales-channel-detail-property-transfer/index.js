import template from './bf-sales-channel-detail-property-transfer.html.twig';
import './bf-sales-channel-detail-property-transfer.scss';

const { Component, Mixin} = Shopware;
const { Criteria } = Shopware.Data;

Component.register('bf-sales-channel-detail-property-transfer', {
    template,
    mixins: [
        Mixin.getByName('notification'),
        Mixin.getByName('listing')
    ],
    inject: ['repositoryFactory', 'bfPropertyService'],
    data() {
        return {
            propertyGroup: null,
            sortBy: 'name',
            isLoading: false,
            sortDirection: 'ASC',
            showDeleteModal: false,
            transferredProperties: []
        };
    },
    created() {
        this.getTransferredProperties();
    },
    computed: {
        propertyRepository() {
            return this.repositoryFactory.create('property_group');
        },

        defaultCriteria() {
            const criteria = new Criteria(this.page, this.limit);

            criteria.addSorting(Criteria.sort(this.sortBy, this.sortDirection, this.useNaturalSorting));

            return criteria;
        },

        useNaturalSorting() {
            return this.sortBy === 'property.name';
        }
    },
    methods: {
        getList() {
            this.isLoading = true;

            return this.propertyRepository.search(this.defaultCriteria, Shopware.Context.api).then((items) => {
                this.propertyGroup = items;
                this.isLoading = false;

                return items;
            }).catch(() => {
                this.isLoading = false;
            });
        },
        getPropertyColumns() {
            return [{
                property: 'name',
                label: 'bf-property-transfer.list.columnName',
                routerLink: 'sw.property.detail',
                inlineEdit: 'string',
                allowResize: false,
                primary: true
            }, {
                property: 'transfer',
                label: 'bf-property-transfer.list.columnTransfer',
                width: '50px',
                visible: true,
                sortable: false,
                allowResize: false
            }];
        },
        checked(item) {
            for (let i = 0; i < this.transferredProperties.length; i++) {
                if (this.transferredProperties[i].indexOf(item.id) > 0) {
                    return true;
                }
            }

            return false;
        },

        toggleItemCheck($event, item) {
            let uniqueName = this.createPropertyUniqName(item.name, item.id);

            if ($event) {
                this.transferredProperties.push(uniqueName);
            } else {
                this.transferredProperties.splice(this.transferredProperties.indexOf(uniqueName), 1);
            }

            localStorage.setItem('bfTransferredProperties', this.transferredProperties)
        },

        getTransferredProperties() {
            this.bfPropertyService.loadPropertyData()
                .then((response) => {
                    response.data.forEach(configuration => {
                        if (
                            configuration.configurationKey === 'PROPERTIES_TO_IMPORT_AS_ATTRIBUTES'
                            && configuration.configurationValue !== ''
                        ) {
                            this.transferredProperties = configuration.configurationValue.split(',');
                        }
                    });

                    localStorage.setItem('bfTransferredProperties', this.transferredProperties);

                    this.isLoading = false;
                }).catch((error) => {
                this.isLoading = false;
                console.log(error);
                // ToDo: error handling
            });
        },

        createPropertyUniqName(name, id) {
            return name + ' ##' + id + '##';
        },
    }
});

