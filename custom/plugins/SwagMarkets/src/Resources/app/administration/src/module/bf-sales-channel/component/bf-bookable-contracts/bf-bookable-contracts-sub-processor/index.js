import template from './bf-bookable-contracts-sub-processor.html.twig';
import './bf-bookable-contracts-sub-processor.scss';
const {Component} = Shopware;

Component.register('bf-bookable-contracts-sub-processor', {
    template,

    props: {
        subProcessorData: {
            type: String,
            required: true,
            default: ''
        }
    }
});
