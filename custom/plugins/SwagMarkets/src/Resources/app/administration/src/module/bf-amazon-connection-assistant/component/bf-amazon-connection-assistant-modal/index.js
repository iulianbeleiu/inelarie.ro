import template from './bf-amazon-connection-assistant-modal.html.twig';
import './bf-amazon-connection-assistant-modal.scss';

const {Component} = Shopware;
Component.register('bf-amazon-connection-assistant-modal', {
    template,
    inject: [
        'BfConnectionAssistantService',
    ],
    data() {
        return {
            title: this.$tc('amazon.baseTitle'),
            buttonConfig: [],
            showModal: false,
            stepsToGetBack: -1,
            marketplaceId: '',
            accountData: {
                retailerId: '',
                mwsToken: ''
            },
            nextIsDisabled: true,
            nextBtnIsClicked: false,
            isLoading: false,
            isFinished: false,
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
                params: {accountData: this.accountData, marketplaceId: this.marketplaceId}
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
