import template from './bf-sales-channel-unit-mapping.html.twig';

const {Component} = Shopware;

Component.override('bf-sales-channel-detail', {
    name: 'bf-sales-channel-unit-mapping',
    template
});
