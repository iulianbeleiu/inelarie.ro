import template from './bf-sales-channel-modal-grid.html.twig';

const {Component} = Shopware;
const {Criteria} = Shopware.Data;

Component.override('sw-sales-channel-modal-grid', {
    name: 'bf-sales-channel-modal-grid',
    template,
    inject: ['repositoryFactory'],
    data() {
        return {
            sct: [],
            salesChannels: []
        }
    },
    computed: {
        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        }
    },
    created() {
        this.extendSalesChannelType();
    },
    methods: {
        extendSalesChannelType() {
            const criteria = new Criteria();

            criteria.setPage(1);
            criteria.setLimit(500);
            criteria.addSorting(Criteria.sort('sales_channel.name', 'ASC'));
            criteria.addAssociation('type');

            this.salesChannelRepository.search(criteria, Shopware.Context.api).then((response) => {
                this.salesChannels = response;

                this.salesChannelTypes.forEach((item, index) => {
                    let _isCreated = false;
                    this.salesChannels.filter((salesChannel) => {

                        if (salesChannel.typeId === item.id
                            && (salesChannel.typeId === '26a9ece25bd14b288b30c3d71e667d2c' || salesChannel.typeId === '7ff39608fed04e4bbcc62710b7223966')) {
                            _isCreated = true;
                        }
                    });

                    this.sct.push(Object.assign({}, item, {isCreated: _isCreated}));
                });

                this.$nextTick(function () {
                    this.salesChannelTypes = this.sct;
                });

            });
        }
    }
});
