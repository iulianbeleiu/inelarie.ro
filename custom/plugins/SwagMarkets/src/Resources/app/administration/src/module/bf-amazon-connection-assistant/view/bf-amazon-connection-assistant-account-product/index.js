import template from './bf-amazon-connection-assistant-account-product.html.twig';
import './bf-amazon-connection-assistant-account-product.scss';

const {Component, Mixin, Application} = Shopware

Component.register('bf-amazon-connection-assistant-account-product', {
    template,
    inject: [
        'BfConnectionAssistantService',
        'loginService'
    ],
    mixins: [
        Mixin.getByName('notification')
    ],
    props: {
        nextBtnIsClicked: Boolean,
        showSupportModal: Boolean
    },
    data() {
        return {
            hasRetailerProducts: null,
            tooltip: {
                message: this.$tc('amazon.productCheckTooltip')
            },
            showConfirmModal: false
        }
    },
    created() {
        this.setTitle();
    },
    watch: {
        nextBtnIsClicked: {
            handler: function (val) {
                if (val === true) {
                    this.showConfirmFinishModal();
                }
            },
            deep: true
        }
    },
    methods: {
        setTitle() {
            const title = this.$tc('amazon.baseTitle') + this.$tc('amazon.step3');
            this.$emit('set-title', title);
        },
        productCheck() {
            this.$emit('ca-isLoading', true);
            this.BfConnectionAssistantService.marketplaceArticleExists('amazon',{
                mwsAuthToken: this.$route.params.accountData.mwsToken,
                sellerId: this.$route.params.accountData.retailerId,
                marketplaceId: this.$route.params.marketplaceId
            }).then((response) => {
                this.$emit('ca-isLoading', false);
                if (response.data.success === true && response.status === 200) {
                    this.hasRetailerProducts = response.data.data.productsDataExists !== false;

                    if (this.hasRetailerProducts === false) {
                        this.$emit('ca-setNextBtnState', false)
                    }
                }else {
                    this.$emit('ca-isLoading', false);
                    this.createNotificationError({
                        title: this.$tc('error.amazon.title'),
                        message: this.$tc('error.global.internalError')
                    })
                }
            }).catch((error) => {
                this.$emit('ca-isLoading', false);
                this.createNotificationError({
                    title: this.$tc('error.amazon.title'),
                    message: this.$tc('error.global.internalError')
                })
            });
        },
        nextStep() {
        },
        showConfirmFinishModal() {
            this.showConfirmModal = true;
        },
        confirmFinishModal() {
            this.showConfirmModal = false;
            this.$emit('ca-isLoading', true);
            this.sendIsConnectedDataToBackend();
        },
        closeModal() {
            this.$emit("ca-resetNextBtnIsClicked");
            this.showConfirmModal = false;
        },
        sendIsConnectedDataToBackend(){
            Application.getContainer('init').httpClient.post(
                '/swagMarkets/amazon/finishConnectionAssistant',
                {
                    is_connected: true
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.loginService.getToken()}`
                    }
                }
            ).then((response) =>{
                this.$emit('ca-isLoading', false);
                if (response.data.success === true) {
                    this.createNotificationSuccess({
                        title: this.$tc('success.amazon.title'),
                        message: this.$tc('success.amazon.successfulFinishedConnectionAssistant')
                    });
                    this.$emit('modal-close', true);
                } else {
                    this.$emit("ca-resetNextBtnIsClicked");
                    this.createNotificationError({
                        title: this.$tc('error.amazon.title'),
                        message: this.$tc('error.amazon.confirmFinishSavingDataError')
                    });
                }
            }).catch((error) =>{
                this.$emit('ca-isLoading', false);
                this.$emit("ca-resetNextBtnIsClicked");
                this.createNotificationError({
                    title: this.$tc('error.amazon.title'),
                    message: this.$tc('error.global.internalError')
                })
            });
        }
    }
});
