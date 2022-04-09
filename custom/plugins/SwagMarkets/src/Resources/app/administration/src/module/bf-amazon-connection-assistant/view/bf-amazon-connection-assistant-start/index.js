import template from './bf-amazon-connection-assistant-start.html.twig';
import './bf-amazon-connection-assistant-start.scss';

Shopware.Component.register('bf-amazon-connection-assistant-start', {
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
            this.title = 'Amazon connection assistant';
            this.$emit('set-title', this.title);
        },
        getTitle() {
            return this.title;
        },
    }
});
