import '../../service/bf-connection-assistant.service';

/* Importing components */
import './component/bf-amazon-connection-assistant-modal';
import './component/bf-amazon-connection-assistant-logo';
import './component/bf-amazon-connection-assistant-account-status';

/* Importing pages */
import './page/index';


/* Importing views */
import './view/bf-amazon-connection-assistant-start';
import './view/bf-amazon-connection-assistant-start-authorize';
import './view/bf-amazon-connection-assistant-start-success';
import './view/bf-amazon-connection-assistant-account';
import './view/bf-amazon-connection-assistant-account-marketplace';
import './view/bf-amazon-connection-assistant-account-product';

const {Module} = Shopware;

Module.register('bf-amazon-connection-assistant', {
    type: 'plugin',
    name: 'swagMarkets-amazon-connection-assistant',
    routes: {
        index: {
            component: 'bf-amazon-connection-assistant-index',
            path: 'index',
            redirect: {
                name: 'bf.amazon.connection.assistant.index.start.authorize'
            },
            children: {
                start: {
                    component: 'bf-amazon-connection-assistant-start',
                    path: 'start',
                    children: {
                        authorize: {
                            component: 'bf-amazon-connection-assistant-start-authorize',
                            path: 'authorize'
                        },
                        success: {
                            component: 'bf-amazon-connection-assistant-start-success',
                            path: 'success',
                            redirect: {
                                name: 'bf.amazon.connection.assistant.index.account'
                            }
                        }
                    }
                },
                account: {
                    component: 'bf-amazon-connection-assistant-account',
                    path: 'account',
                    redirect: {
                        name: 'bf.amazon.connection.assistant.index.account.marketplace'
                    },
                    children: {
                        marketplace: {
                            component: 'bf-amazon-connection-assistant-account-marketplace',
                            path: 'marketplace'
                        },
                        'product-check': {
                            component: 'bf-amazon-connection-assistant-account-product',
                            path: 'product-check'
                        }
                    }
                }
            }
        }
    }
});
