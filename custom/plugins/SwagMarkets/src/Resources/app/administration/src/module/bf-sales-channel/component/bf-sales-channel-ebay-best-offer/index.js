import template from './bf-sales-channel-ebay-best-offer.html.twig'
import './bf-sales-channel-ebay-best-offer.scss'

const {Component, Mixin} = Shopware;
Component.register('bf-sales-channel-ebay-best-offer', {
    template,
    mixins: [
        Mixin.getByName('notification')
    ],
    props: {
        isGeneralPage: false,
        clientExists: {
            type: Boolean,
            required: true
        },
        clientInProgress: {
            type: Boolean,
            required: true
        },
        currentContractName: {
            type: String,
            required: true,
            default: ''
        },
        ebayBestOfferActive: {
            type: Boolean,
            required: true,
            default: false
        },
        ebayBestOfferAbsolute: {
            type: Number,
            required: true,
            default: 0
        },
        ebayBestOfferRelative: {
            type: Number,
            required: true,
            default: 0
        },
        ebayBestOfferAutoAccept: {
            type: Boolean,
            required: true,
            default: false
        },
        ebayBestOfferAbsoluteAutoAccept: {
            type: Number,
            required: true,
            default: 0
        },
        ebayBestOfferRelativeAutoAccept: {
            type: Number,
            required: true,
            default: 0
        },
        useBrandAsManufacturer: {
            type: Boolean,
            required: true,
            default: true
        },
        ebayBestOfferFix: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    computed: {
        isDisabled() {
            return !this.clientExists
                || this.clientInProgress
                || this.currentContractName === ''
                || this.currentContractName === 'SwagMarketsStarter';
        }
    },
    methods: {
        changeInput(fieldName, event) {
            if (fieldName === 'ebayBestOfferAbsoluteAutoAccept' && event < this.ebayBestOfferAbsolute) {
                this.showErrorNotification('absoluteAutoAcceptMessage');

                event = this.ebayBestOfferAbsolute;
            } else if (fieldName === 'ebayBestOfferRelativeAutoAccept' && event < this.ebayBestOfferRelative) {
                this.showErrorNotification('relativeAutoAcceptMessage');

                event = this.ebayBestOfferRelative;
            }
            else if (fieldName === 'ebayBestOfferAbsolute' && (event > this.ebayBestOfferAbsoluteAutoAccept)) {
                this.showErrorNotification('absoluteAutoAcceptMessage');

                event = this.ebayBestOfferAbsoluteAutoAccept;
            } else if (fieldName === 'ebayBestOfferRelative' && (event > this.ebayBestOfferRelativeAutoAccept)) {
                this.showErrorNotification('relativeAutoAcceptMessage');

                event = this.ebayBestOfferRelativeAutoAccept;
            }

            this.$emit('change', fieldName, event)
        },
        showErrorNotification(messageKey) {
            this.createNotificationError({
                title: this.$tc('bf-ebay-best-offer.notification.error.title'),
                message: this.$tc('bf-ebay-best-offer.notification.error.' + messageKey)
            });
        }
    }
})
