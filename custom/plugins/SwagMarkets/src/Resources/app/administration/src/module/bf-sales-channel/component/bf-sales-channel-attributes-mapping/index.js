import template from './bf-sales-channel-attributes-mapping.html.twig';

import './properties-mapping';
import './custom-fields-mapping';

const {Component, Context} = Shopware;
const {Criteria} = Shopware.Data;

Component.register('bf-sales-channel-attributes-mapping', {
    template,

    inject: [
        'repositoryFactory',
        'bfPropertyService',
    ],

    props: {
        salesChannelType: {
            type: String,
            default: ''
        },
        amazonSegment: {
            type: String,
            default: ''
        },
        amazonProductType: {
            type: String,
            default: ''
        }
    }
});
