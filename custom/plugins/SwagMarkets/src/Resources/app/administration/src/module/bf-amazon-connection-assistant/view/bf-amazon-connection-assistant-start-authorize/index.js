import template from './bf-amazon-connection-assistant-start-authorize.html.twig';
import './bf-amazon-connection-assistant-start-authorize.scss';

const {Component, Service, Mixin} = Shopware;

Component.register('bf-amazon-connection-assistant-start-authorize', {
    template,
    mixins: [
        Mixin.getByName('notification')
    ],
    inject: ['BfConnectionAssistantService'],
    data() {
        return {
            retailerId: null,
            mwsToken: null,
            title: this.$parent.getTitle(),
            howToFirstPart: this.$tc('amazon.howTo.mwsNotificationHowToFirstPart',0,{link: "<a href=\"https://sellercentral.amazon.de/gp/mws/registration/register.html\" target=\"_blank\">SellerCentral</a>"})
        }
    },
    created() {
        this.setTitle();
    },
    methods: {
        setTitle() {
            const title = this.$tc('amazon.baseTitle') + this.$tc('amazon.step1');

            this.$emit('set-title', title);
        },
        authorizeManual() {
            const retailerId = this.retailerId;
            const mwsToken = this.mwsToken;
            if (this.validate(retailerId, mwsToken) === true) {
                this.$emit('ca-isLoading', true);
                this.BfConnectionAssistantService.authorizeAmazon(
                    retailerId,
                    mwsToken,
                    this.$route.params.marketplaceId).then(response =>{
                    if (response.data.success === true && response.status === 200) {
                        this.BfConnectionAssistantService.storeShopsConfigurations('amazon', {
                            shopsConfigurations: {
                                MERCHANT_ID: retailerId,
                                MWS_AUTH_TOKEN: mwsToken
                            }
                        }).then(response => {
                            this.$emit('ca-isLoading', false);
                            this.createNotificationSuccess({
                                title: this.$tc('success.amazon.title'),
                                message: this.$tc('success.amazon.accountConnectionSuccess')
                            })
                            //add account data
                            this.$emit('ca-setAccountData', retailerId, mwsToken)
                            //before redirect add 1 to steps to get back
                            this.$emit('ca-stepsToGetBack');
                            //redirect to next step
                            this.$emit('ca-redirect', 'bf.sales.channel.detail.base.amazonConnectionAssistant.account.marketplace');
                        }).catch(error => {
                            this.$emit('ca-isLoading', false);
                            this.createNotificationError({
                                title: this.$tc('error.amazon.title'),
                                message: this.$tc('error.amazon.accountConnectionError')
                            })
                        });
                    } else {
                        this.$emit('ca-isLoading', false);
                        this.createNotificationError({
                            title: this.$tc('error.amazon.title'),
                            message: this.$tc('error.amazon.accountConnectionError')
                        })
                    }
                }).catch((error) => {
                    this.$emit('ca-isLoading', false);
                    this.createNotificationError({
                        title: this.$tc('error.amazon.title'),
                        message: this.$tc('error.global.internalError')
                    })
                });
            }
        },

        /**
         * @param retailerId
         * @param mwsToken
         * @returns {boolean}
         */
        validate(retailerId, mwsToken){
            if (retailerId === null || mwsToken === null || retailerId.length === 0 || mwsToken.length === 0) {
                this.createNotificationError({
                    title: this.$tc('error.amazon.title'),
                    message: this.$tc('error.amazon.credentialValidationError')
                });
                return false;
            }

            return true;
        }
    }
});
