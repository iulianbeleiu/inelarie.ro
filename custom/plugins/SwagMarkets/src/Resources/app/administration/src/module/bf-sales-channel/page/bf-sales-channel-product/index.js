import template from './bf-sales-channel-product.html.twig';

const {Component} = Shopware;

Component.override('bf-sales-channel-detail', {
    name: 'bf-sales-channel-product',
    template
});
