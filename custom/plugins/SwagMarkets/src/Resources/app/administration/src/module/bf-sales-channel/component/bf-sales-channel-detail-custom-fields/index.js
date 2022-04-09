import template from './bf-sales-channel-detail-custom-fields.html.twig';
import './bf-sales-channel-detail-custom-fields.scss';

const { Component, Mixin} = Shopware;
const { Criteria } = Shopware.Data;

Component.register('bf-sales-channel-detail-custom-fields', {
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
            transferredCustomFields: []
        };
    },
    created() {
        this.getTransferredCustomFields();
    },
    computed: {
        customFieldsRepository() {
            return this.repositoryFactory.create('custom_field');
        },

        defaultCriteria() {
            const criteria = new Criteria(this.page, this.limit);

            criteria.addSorting(Criteria.sort(this.sortBy, this.sortDirection, this.useNaturalSorting));
            criteria.addFilter(Criteria.equals('customFieldSet.relations.entityName', 'product'));
            criteria.addFilter(Criteria.equals('active', 1));
            criteria.addAssociation('customFieldSet');

            return criteria;
        },

        useNaturalSorting() {
            return this.sortBy === 'property.name';
        }
    },
    methods: {
        getList() {
            this.isLoading = true;

            return this.customFieldsRepository.search(this.defaultCriteria, Shopware.Context.api).then((items) => {
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
                label: 'bf-custom-fields-transfer.list.columnName',
                routerLink: 'sw.property.detail',
                inlineEdit: 'string',
                allowResize: false,
                primary: true
            }, {
                property: 'transfer',
                label: 'bf-custom-fields-transfer.list.columnTransfer',
                width: '50px',
                visible: true,
                sortable: false,
                allowResize: false
            }];
        },
        checked(item) {
            for (let i = 0; i < this.transferredCustomFields.length; i++) {
                if (this.createPropertyUniqName(item.name, item.id) === this.transferredCustomFields[i]) {
                    return true;
                }
            }

            return false;
        },

        toggleItemCheck($event, item) {
            let uniqueName = this.createPropertyUniqName(item.name, item.id);

            if ($event) {
                this.transferredCustomFields.push(uniqueName);
            } else {
                this.transferredCustomFields.splice(this.transferredCustomFields.indexOf(uniqueName), 1);
            }

            localStorage.setItem('bfTransferredCustomFields', this.transferredCustomFields)
        },

        getTransferredCustomFields() {
            this.bfPropertyService.loadPropertyData()
                .then((response) => {
                    response.data.forEach(configuration => {
                        if (
                            configuration.configurationKey === 'CUSTOM_FIELDS_TO_IMPORT_AS_ATTRIBUTES'
                            && configuration.configurationValue !== ''
                        ) {
                            this.transferredCustomFields = configuration.configurationValue.split(',');
                        }
                    });

                    localStorage.setItem('bfTransferredCustomFields', this.transferredCustomFields);

                    this.isLoading = false;
                }).catch((error) => {
                this.isLoading = false;

                // ToDo: error handling
            });
        },

        createPropertyUniqName(name, id) {
            return name + ' ##' + id + '##';
        },
    }
});
