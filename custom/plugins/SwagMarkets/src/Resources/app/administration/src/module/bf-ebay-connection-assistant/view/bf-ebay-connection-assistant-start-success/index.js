import template from './bf-ebay-connection-assistant-start-success.html.twig';
import './bf-ebay-connection-assistant-start-success.scss';

Shopware.Component.register('bf-ebay-connection-assistant-start-success', {
    template,
    data() {
        return {
            title: this.$parent.getTitle()
        }
    },
    created() {
        this.setTitle();
    },
    methods: {
        setTitle() {
            const title = !this.title ?  'Account Status' : this.title + ' - Account Status';

            this.$emit('set-title', title);
        }
    }
});
