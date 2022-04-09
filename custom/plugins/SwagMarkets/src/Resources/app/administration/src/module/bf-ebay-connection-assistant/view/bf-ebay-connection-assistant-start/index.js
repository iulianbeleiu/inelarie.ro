import template from './bf-ebay-connection-assistant-start.html.twig';
import './bf-ebay-connection-assistant-start.scss';

Shopware.Component.register('bf-ebay-connection-assistant-start', {
    template,
    data() {
        return {
            title: null
        }
    },
    created() {
        this.setTitle();
    },
    methods: {
        setTitle() {
            this.title = 'Ebay connection assistant';
            this.$emit('set-title', this.title);
        },
        getTitle() {
            return this.title;
        },
    }
});
