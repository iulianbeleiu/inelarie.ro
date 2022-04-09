import NavigationMenuPlugin from './plugin/main-menu/navigation-menu.plugin';
import ShapeFlyoutMenuPlugin from './plugin/main-menu/flyout-menu.plugin';
import ShapeGallerySliderPlugin from './plugin/slider/gallery-slider.plugin';
import ShapeListingPlugin from './plugin/listing/listing.plugin';
import ShapeDatePickerPlugin from "./plugin/date-picker/date-picker.plugin";
import CustomizedProductsStepByStepWizard from "./plugin/customized-product/customized-product-step.plugin";
import CustomizedProductToggle from "./plugin/customized-product/customized-product-toggle.plugin";
import ShapeProductBoxPlugin from './plugin/product-box/product-box.plugin';

const PluginManager = window.PluginManager;

PluginManager.register('ShapeNavigationMenu', NavigationMenuPlugin, '[data-navigation-menu]');
PluginManager.register('ShapeFlyoutMenu', ShapeFlyoutMenuPlugin, '[data-navigation-link]');
PluginManager.register('ShapeCustomizedProductsToggle', CustomizedProductToggle, '*[data-customized-products-toggle="true"]');
PluginManager.register('ShapeProductBox', ShapeProductBoxPlugin, '[data-product-box]');

PluginManager.override('Listing', ShapeListingPlugin, '[data-listing]');
PluginManager.override('GallerySlider', ShapeGallerySliderPlugin, '[data-gallery-slider]');
PluginManager.override('DatePicker', ShapeDatePickerPlugin, '[data-date-picker]');

if (PluginManager.getPluginList().SwagCustomizedProductsStepByStepWizard) {
    PluginManager.override('SwagCustomizedProductsStepByStepWizard', CustomizedProductsStepByStepWizard, '*[data-swag-customized-product-step-by-step="true"]');
}

