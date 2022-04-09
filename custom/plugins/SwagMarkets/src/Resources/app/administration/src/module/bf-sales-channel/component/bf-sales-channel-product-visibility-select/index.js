import template from './bf-sales-channel-product-visibility-select.html.twig';

const {Component, Mixin, Context} = Shopware;
const {Criteria} = Shopware.Data;

Component.override('sw-product-visibility-select', {
    template,
    inject: [
        'bfSystemApiService'
    ],
    mixins: [
        Mixin.getByName('notification')
    ],
    computed: {
        productRepository() {
            return this.repositoryFactory.create('product')
        }
    },
    data() {
        return {
            skuLimit: null
        }
    },
    created() {
        this.criteria.addAssociation('type');
        this.getSkuLimit();
    },
    methods: {
        getSkuLimit() {
            return this.bfSystemApiService
                .getSkuLimit()
                .then((response) => {
                    if (response.success) {
                        return this.skuLimit = response.data.skuLimit
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        },
        addItem(item) {
            if (item.type.translated.manufacturer === 'brickfox GmbH') {
                if (this.isSelected(item)) {
                    const associationEntity = this.currentCollection.find(entity => {
                        return entity.salesChannelId === item.id;
                    });
                    this.remove(associationEntity);
                    return;
                }

                const criteria = new Criteria(1, 1);
                criteria.addFilter(
                    Criteria.equals('product.visibilities.salesChannelId', item.id)
                );
                criteria.addAssociation('visibilities');

                this.productRepository
                    .search(criteria, Context.api)
                    .then((products) => {
                        if(products.total >= this.skuLimit) {
                            return this.createNotificationError({
                                title: 'Error',
                                message: 'SKU Limit for this channel was reached'
                            });
                        }

                        this.$super('addItem', item);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
                return;
            }

            this.$super('addItem', item);
        },
    }
});