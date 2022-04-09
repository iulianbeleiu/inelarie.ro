<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Pos\Api\Service;

use Shopware\Core\Content\Media\MediaEntity;
use Shopware\Core\Content\Media\Pathname\UrlGeneratorInterface;
use Swag\PayPal\Pos\Api\Image\BulkImageUpload\ImageUpload;
use Swag\PayPal\Pos\Exception\InvalidMediaTypeException;

class MediaConverter
{
    private UrlGeneratorInterface $urlGenerator;

    public function __construct(UrlGeneratorInterface $urlGenerator)
    {
        $this->urlGenerator = $urlGenerator;
    }

    public function convert(string $domain, MediaEntity $mediaEntity, ?string $lookupKey = null): ImageUpload
    {
        $mime = $mediaEntity->getMimeType();
        $format = $this->matchMimeType($mime);
        $mediaUrl = $this->urlGenerator->getRelativeMediaUrl($mediaEntity);
        $encodedMediaUrl = \implode('/', \array_map('rawurlencode', \explode('/', $mediaUrl)));

        $imageUpload = new ImageUpload();
        $imageUpload->setImageFormat($format);
        $imageUpload->setImageUrl($domain . '/' . $encodedMediaUrl);

        if ($lookupKey !== null) {
            $imageUpload->setImageLookupKey($lookupKey);
        }

        return $imageUpload;
    }

    private function matchMimeType(?string $mimeType): string
    {
        switch ($mimeType) {
            case 'image/jpeg':
                return 'JPEG';
            case 'image/png':
                return 'PNG';
            case 'image/gif':
                return 'GIF';
            case 'image/bmp':
            case 'image/x-bmp':
            case 'image/x-ms-bmp':
                return 'BMP';
            case 'image/tiff':
                return 'TIFF';
            default:
                throw new InvalidMediaTypeException($mimeType ?? 'unknown');
        }
    }
}
