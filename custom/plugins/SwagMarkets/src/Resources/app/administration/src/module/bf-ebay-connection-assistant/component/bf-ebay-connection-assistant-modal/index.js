import template from './bf-ebay-connection-assistant-modal.html.twig';
import './bf-ebay-connection-assistant-modal.scss';

const {Component} = Shopware;
Component.register('bf-ebay-connection-assistant-modal', {
    template,
    inject: ['BfConnectionAssistantService'],
    data() {
        return {
            title: 'Ebay Connection Assistant',
            buttonConfig: [],
            showModal: false,
            stepsToGetBack: -1,
            marketplaceId: '',
            nextIsDisabled: true,
            nextBtnIsClicked: false,
            isLoading: false,
            isFinished: false,
            authTokenStateIntervalId: null,
            showSupportModal: false
        }
    },
    methods: {
        closeModal(isFinished) {
            if (isFinished === true) {
                this.isFinished = isFinished;
            }
            this.showModal = false;

        },
        setTitle(title) {
            this.title = title;
        },
        redirect(routerName) {
            this.$router.push({
                name: routerName,
                params: {marketplaceId: this.marketplaceId}
            });
        },
        addStepsToGetBack() {
            this.stepsToGetBack -= 1;
        },
        setAccountData(retailerId, mwsToken) {
            this.accountData.retailerId = retailerId;
            this.accountData.mwsToken = mwsToken;
        },
        setNextBtnState(state) {
            this.nextIsDisabled = state;
        },
        onClickNext() {
            this.nextBtnIsClicked = true;
        },
        resetNextBtnIsClicked() {
            this.nextBtnIsClicked = false;
        },
        setIsLoadingState(state) {
            this.isLoading = state;
        },
        sleep(milliseconds){
            return new Promise(resolve => setTimeout(resolve, milliseconds));
        },
        startCheckTokenState(){
            this.setIsLoadingState(true);
            this.authTokenStateIntervalId = setInterval(this.checkTokenState, 5000);
        },
        checkTokenState(){
            this.BfConnectionAssistantService.ebayAuthorizationTokenState().then((response) =>{
                if (response.status === 200 && response.data.success === true && response.data.data.isConnected === true){
                    clearInterval(this.authTokenStateIntervalId);
                    this.setIsLoadingState(false);
                    this.addStepsToGetBack();
                    this.redirect('bf.sales.channel.detail.base.ebayConnectionAssistant.start.authorize-oauth');
                }
            });
        },
        startCheckOAuthTokenState(){
            this.setIsLoadingState(true);
            this.authTokenStateIntervalId = setInterval(this.checkOAuthTokenState, 5000);
        },
        checkOAuthTokenState(){
            this.BfConnectionAssistantService.ebayAuthorizationOAuthTokenState().then((response) =>{
                if (response.status === 200 && response.data.success === true && response.data.data.isConnected === true){
                    clearInterval(this.authTokenStateIntervalId)
                    this.setIsLoadingState(false);
                    this.addStepsToGetBack();
                    this.redirect('bf.sales.channel.detail.base.ebayConnectionAssistant.account.marketplace');
                }
            });
        }
    },
    mounted() {
        this.showModal = true;
        if (!this.$route.params.marketplaceId) {
            this.showModal = false;
        }
        this.marketplaceId = this.$route.params.marketplaceId;
    },
    watch: {
        showModal(val) {
            if (this.authTokenStateIntervalId !== null && this.authTokenStateIntervalId !== undefined) {
                clearInterval(this.authTokenStateIntervalId);
            }
            if (val === false) {
                if (this.isFinished === false) {
                    this.$router.go(this.stepsToGetBack);
                }
                if (this.isFinished === true) {
                    //bad work around for force reload
                    this.$router.go(0);
                }
            }
        }
    }
});
