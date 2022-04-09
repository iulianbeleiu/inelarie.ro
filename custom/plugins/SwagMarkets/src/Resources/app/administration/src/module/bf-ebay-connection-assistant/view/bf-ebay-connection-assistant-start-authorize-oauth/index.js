import template from './bf-ebay-connection-assistant-start-authorize-oauth.html.twig';
import './bf-ebay-connection-assistant-start-authorize-oauth.scss';

const {Component} = Shopware;

Component.register("bf-ebay-connection-assistant-start-authorize-oauth", {
    template,
    inject: ['BfConnectionAssistantService'],
    data(){
        return {
            btnDisabled: false,
            errorGetOAuthTokenLink: false,
            oAuthTokenLink: '',
            oAuthIntervalId: null
        }
    },
    methods: {
        setTitle() {
            const title = this.$tc('ebay.baseTitle') + this.$tc('ebay.step2');
            this.$emit('set-title', title);
        },
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        authorizeOAuth(){
            window.open(this.oAuthTokenLink, '_blank');
            this.$emit('ca-startCheckOAuthTokenState');
        },
        async getEbayOAuthTokenLink(){
            this.$emit('ca-isLoading', true);
            await this.BfConnectionAssistantService.ebayOAuthTokenLink().then((response) => {
                this.oAuthTokenLink = decodeURIComponent(response.data.data.irpLink);
            }).catch(() =>{
                this.errorGetOAuthTokenLink = true;
            });
            this.$emit('ca-isLoading', false);
        }
    },
    created(){
        this.setTitle();
        this.getEbayOAuthTokenLink();
    }
});
