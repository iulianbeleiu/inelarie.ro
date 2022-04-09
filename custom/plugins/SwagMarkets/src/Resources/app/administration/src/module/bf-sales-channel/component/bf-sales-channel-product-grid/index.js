import template from './bf-sales-channel-product-grid.html.twig';
import './bf-sales-channel-product-grid.scss';

const {Component} = Shopware;

Component.extend('bf-sales-channel-product-grid', 'sw-entity-listing', {
    template,
    inject: ['BfSalesChannelService'],
    props: {
        shopProductData: {
            type: Array,
            required: true
        },
        marketplace: {
            type: Object,
            required: true
        },
        currentContract: {
            type: Object,
            required: true
        },
        marketplaceName: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            clientExists: false,
            clientInProgress: false,
            selectedProduct: null,
            showProductDetailModal: false,
            showAsinManagement: false
        }
    },
    created() {
        this.checkClientState();
    },
    computed: {
        getMarketplaceName() {
            return this.marketplaceName
        }
    },
    methods: {
        paginate(args) {
            this.$emit('paginateBf', args);
            this.$emit('page-change', args);
        },
        checkClientState() {
            this.BfSalesChannelService.checkClientState().then((response) => {
                this.clientExists = response.clientExists;
                this.clientInProgress = response.clientInProgress;
            })
        },
        onEditProductClick(selectedProduct) {
            this.selectedProduct        = selectedProduct;
            this.showProductDetailModal = true;
        },
        onAsinManagement(product) {
            this.selectedProduct = product;
            this.showAsinManagement = true;
        },
        onOpenMarketplaceProductClick: function (selectedProduct) {
            window.open(this.getMarketplaceUrl() + this.getProductId(selectedProduct));
        },
        getMarketplaceUrl() {
            let marketplaceProductUrl = 'https://' + this.marketplace.name;

            if (this.marketplace.type === 'amazon') {
                marketplaceProductUrl += '/dp/product/';
            } else {
                marketplaceProductUrl += '/itm/';
            }

            return marketplaceProductUrl;
        },
        getProductId(product) {
            if (this.marketplace.type === 'ebay') {
                return product.marketplaceProductId
            }

            if (this.marketplace.type === 'amazon' && product.productAsins[0] !== undefined) {
                return product.productAsins[0]
            }

            return ''
        }
    }
});
