import template from './bf-ebay-connection-assistant-account.html.twig';

Shopware.Component.register('bf-ebay-connection-assistant-account', {
    template,
    props: {
        nextBtnIsClicked: Boolean,
    }
});
