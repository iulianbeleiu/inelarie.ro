import template from './sw-card-override.tml.twig';

const {Component} = Shopware;

Component.override('sw-card', {
    name: 'sw-card-override',
    template,

    props: {
        showHelpTextIcon: {
            type: Boolean,
            default() {
                return false;
            }
        },
        helpTextDescription: {
            type: String,
            default() {
                return '';
            }
        },
        helpTextWidth: {
            default() {
                return 200;
            }
        }
    }
});
