import template from './bf-amazon-connection-assistant-account.html.twig';

Shopware.Component.register('bf-amazon-connection-assistant-account', {
    template,
    props: {
        nextBtnIsClicked: Boolean
    }
});
