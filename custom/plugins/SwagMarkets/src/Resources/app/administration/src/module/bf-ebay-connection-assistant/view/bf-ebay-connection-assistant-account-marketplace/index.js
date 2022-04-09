import template from './bf-ebay-connection-assistant-account-marketplace.html.twig';
import './bf-ebay-connection-assistant-account-marketplace.scss';

Shopware.Component.register('bf-ebay-connection-assistant-account-marketplace', {
    template,
    inject: ['BfConnectionAssistantService'],
    props: {
        nextBtnIsClicked: Boolean
    },
    data() {
        return {
            canRetailerSell: null,
            tooltip: {
                message: this.$tc('amazon.validateMarketplaceTooltip')
            }
        }
    },
    created() {
        this.setTitle();
    },
    watch: {
        nextBtnIsClicked: {
            handler: function (val) {
                if (val === true) {
                    this.nextStep();
                }
            },
            deep: true
        }
    },
    methods: {
        setTitle() {
            const title = this.$tc('ebay.baseTitle') + this.$tc('ebay.step3');

            this.$emit('set-title', title);
        },
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        async siteIdCheck(){
            this.$emit('ca-isLoading', true);
            await this.BfConnectionAssistantService.ebaySiteIdCheck(this.$route.params.marketplaceId).then((response) => {
                if (response.status === 200 && response.data.success === true && response.data.data.siteId === true){
                    this.BfConnectionAssistantService.storeShopsConfigurations('ebay', {
                        shopsConfigurations: {
                            EBAY_SITE_ID: this.$route.params.marketplaceId
                        }
                    }).then(() => {
                       this.BfConnectionAssistantService.triggerCategoriesImport('ebay');
                    });
                    this.canRetailerSell = true;
                    this.$emit('ca-setNextBtnState', false);
                } else {
                    this.canRetailerSell = false;
                }
            });
            this.$emit('ca-isLoading', false);
        },
        nextStep() {
            this.$emit('ca-stepsToGetBack');
            this.$emit('ca-setNextBtnState', true);
            this.$emit('ca-resetNextBtnIsClicked');
            this.$emit('ca-redirect', 'bf.sales.channel.detail.base.ebayConnectionAssistant.account.product-check');
        }
    }
});
