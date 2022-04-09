import template from './bf-amazon-connection-assistant-account-marketplace.html.twig';
import './bf-amazon-connection-assistant-account-marketplace.scss';

const {Component} = Shopware;

Component.register('bf-amazon-connection-assistant-account-marketplace', {
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
            const title = this.$tc('amazon.baseTitle') + this.$tc('amazon.step2');
            this.$emit('set-title', title);
        },
        marketplaceCheck() {
            this.$emit('ca-isLoading', true);
            this.BfConnectionAssistantService.validateMarketplace('amazon', {
                mwsAuthToken: this.$route.params.accountData.mwsToken,
                sellerId: this.$route.params.accountData.retailerId,
                marketplaceId: this.$route.params.marketplaceId
            }).then((response) => {
                if (response.data.success === true && response.status === 200 && response.data.data.isAllowedToListAtMarketplace === true) {
                    this.BfConnectionAssistantService.storeShopsConfigurations('amazon', {
                        shopsConfigurations: {
                            MARKETPLACE: response.data.data.marketplaceId,
                            URL: response.data.data.mwsEndpoint
                        }
                    }).then((response) => {
                        this.BfConnectionAssistantService.triggerCategoriesImport('amazon');
                        this.$emit('ca-isLoading', false);
                        this.canRetailerSell = true;
                        this.$emit('ca-setNextBtnState', false);
                    }).catch((error) => {
                        this.$emit('ca-isLoading', false);
                        this.canRetailerSell = false;
                    });
                } else {
                    this.$emit('ca-isLoading', false);
                    return this.canRetailerSell = false;
                }
            }).catch((error) => {
                this.$emit('ca-isLoading', false);
                this.createNotificationError({
                    title: this.$tc('error.amazon.title'),
                    message: this.$tc('error.global.internalError')
                })
            })
        },
        nextStep() {
            this.$emit('ca-stepsToGetBack');
            this.$emit('ca-setNextBtnState', true);
            this.$emit('ca-resetNextBtnIsClicked');
            this.$emit('ca-redirect', 'bf.sales.channel.detail.base.amazonConnectionAssistant.account.product-check');
        }
    }
});
