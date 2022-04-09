import template from './sw-category-tree-field-override.html.twig';
import './sw-category-tree-field-override.scss';
const {Component} = Shopware;

Component.override('sw-category-tree-field', {
    name: 'sw-category-tree-field-override',
    template,

    props: {
        showLabelName: {
            type: Boolean,
            default: true
        }
    }
});
