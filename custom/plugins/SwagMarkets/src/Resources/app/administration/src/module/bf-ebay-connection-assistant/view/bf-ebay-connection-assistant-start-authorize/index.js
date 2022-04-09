import template from './bf-ebay-connection-assistant-start-authorize.html.twig';
import './bf-ebay-connection-assistant-start-authorize.scss';

const {Component} = Shopware;

Component.register('bf-ebay-connection-assistant-start-authorize', {
    template,
    inject: ['BfConnectionAssistantService'],
    data() {
        return {
            retailerId: null,
            mwsToken: null,
            title: this.$parent.getTitle(),
            btnDisabled: false,
            errorGetConnectionLink: false,
            irpLink: '',
            onConnectBtnClicked: false,
            intervalId: null
        }
    },
    created() {
        this.setTitle();
        this.getEbayConnectLink();
    },
    methods: {
        setTitle() {
            const title = this.$tc('ebay.baseTitle') + this.$tc('ebay.step1');

            this.$emit('set-title', title);
        },
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        authorize(){
            window.open(this.irpLink, '_blank');
            this.$emit('ca-startCheckTokenState');
        },
        async dummyAuthorize() {
            this.$emit('ca-isLoading', true);

            await this.sleep(3000);

            if (this.BfConnectionAssistantService.authorizeEbay() === true) {
                this.$emit('ca-isLoading', false);
                this.createNotificationSuccess({
                    title: this.$tc('success.ebay.title'),
                    message: this.$tc('success.ebay.accountConnectionSuccess')
                });

                this.$nextTick(() => {
                    //before redirect add 1 to steps to get back
                    this.$emit('ca-stepsToGetBack');
                    //redirect to next step
                    this.$emit('ca-redirect', 'bf.sales.channel.detail.base.ebayConnectionAssistant.account.marketplace');
                });
            }
        },
        async getEbayConnectLink(){
            this.$emit('ca-isLoading', true);
            await this.BfConnectionAssistantService.ebayConnectLink().then((response) => {
                if (response.data.success === true && response.status === 200) {
                    this.irpLink = response.data.data.irpLink;
                    this.btnDisabled = false;
                }
            }).catch(() => {
                this.errorGetConnectionLink = true;
            });
            this.$emit('ca-isLoading', false);
        }
    }
});
