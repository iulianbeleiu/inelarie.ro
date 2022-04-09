import GallerySliderPlugin from 'src/plugin/slider/gallery-slider.plugin';

export default class ShapeGallerySliderPlugin extends GallerySliderPlugin {



    /**
     * sets the active dot depending on the slider index
     *
     * @private
     */
    _setActiveDot() {
        super._setActiveDot();

        const currentIndex = this.getCurrentSliderIndex();

        let currentDot = this._dots[currentIndex];

        if (currentDot)
        {
            currentDot.closest(".base-slider").querySelector(".js-dots-text-current").innerHTML = currentIndex + 1;
        }
    }
}
