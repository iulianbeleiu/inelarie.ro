import template from './bf-ebay-connection-assistant-account-product.html.twig';
import './bf-ebay-connection-assistant-account-product.scss';

const {Component, Mixin, Application} = Shopware

Component.register('bf-ebay-connection-assistant-account-product', {
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
                message: this.$tc('ebay.productCheckTooltip')
            },
            showConfirmModal: false,
            errorProductCheck: false
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
            const title = this.$tc('ebay.baseTitle') + this.$tc('ebay.step4');

            this.$emit('set-title', title);
        },
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        async productCheck(){
            this.$emit('ca-isLoading', true);
            await this.BfConnectionAssistantService.marketplaceArticleExists('ebay', {}).then((response) =>{
                if (response.status === 200 && response.data.success === true){
                    this.hasRetailerProducts = response.data.data.articleListingExists;
                    this.$emit('ca-setNextBtnState', false);
                } else {
                    this.errorProductCheck = true;
                }
            }).catch((error) =>{
               this.errorProductCheck = true;
            });

            this.$emit('ca-isLoading', false);
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
        sendIsConnectedDataToBackend() {
            Application.getContainer('init').httpClient.post(
                '/swagMarkets/ebay/finishConnectionAssistant',
                {
                    is_connected: true
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.loginService.getToken()}`
                    }
                }
            ).then((response) => {
                this.$emit('ca-isLoading', false);
                if (response.data.success === true) {
                    this.createNotificationSuccess({
                        title: this.$tc('success.ebay.title'),
                        message: this.$tc('success.ebay.successfulFinishedConnectionAssistant')
                    });
                    this.$emit('modal-close', true);
                } else {
                    this.$emit("ca-resetNextBtnIsClicked");
                    this.createNotificationError({
                        title: this.$tc('error.ebay.title'),
                        message: this.$tc('error.ebay.confirmFinishSavingDataError')
                    });
                }
            }).catch((error) => {
                this.$emit('ca-isLoading', false);
                this.$emit("ca-resetNextBtnIsClicked");
                this.createNotificationError({
                    title: this.$tc('error.ebay.title'),
                    message: this.$tc('error.global.internalError')
                })
            });
        }
    }
});
