import template from './bf-amazon-connection-assistant-start-success.html.twig';
import './bf-amazon-connection-assistant-start-success.scss';

Shopware.Component.register('bf-amazon-connection-assistant-start-success', {
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
