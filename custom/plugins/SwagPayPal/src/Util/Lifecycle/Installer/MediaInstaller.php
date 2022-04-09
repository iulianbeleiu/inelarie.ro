<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Util\Lifecycle\Installer;

use Shopware\Core\Checkout\Payment\Exception\UnknownPaymentMethodException;
use Shopware\Core\Checkout\Payment\PaymentMethodEntity;
use Shopware\Core\Content\Media\File\FileSaver;
use Shopware\Core\Content\Media\File\MediaFile;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Uuid\Uuid;
use Swag\PayPal\Util\Lifecycle\Method\AbstractMethodData;

class MediaInstaller
{
    private const PAYMENT_METHOD_MEDIA_DIR = 'Resources/icons';

    private EntityRepositoryInterface $mediaRepository;

    private EntityRepositoryInterface $mediaFolderRepository;

    private EntityRepositoryInterface $paymentMethodRepository;

    private FileSaver $fileSaver;

    public function __construct(
        EntityRepositoryInterface $mediaRepository,
        EntityRepositoryInterface $mediaFolderRepository,
        EntityRepositoryInterface $paymentMethodRepository,
        FileSaver $fileSaver
    ) {
        $this->mediaRepository = $mediaRepository;
        $this->mediaFolderRepository = $mediaFolderRepository;
        $this->paymentMethodRepository = $paymentMethodRepository;
        $this->fileSaver = $fileSaver;
    }

    public function installPaymentMethodMedia(AbstractMethodData $method, string $paymentMethodId, Context $context, bool $replace = false): void
    {
        $fileName = $method->getMediaFileName();
        if ($fileName === null) {
            return;
        }

        $criteria = new Criteria([$paymentMethodId]);
        $criteria->addAssociation('media');
        $paymentMethod = $this->paymentMethodRepository->search($criteria, $context)->first();
        if ($paymentMethod === null) {
            throw new UnknownPaymentMethodException($paymentMethodId);
        }

        if (!$replace && $paymentMethod->getMediaId()) {
            return;
        }

        $mediaFile = $this->getMediaFile($fileName);
        $savedFileName = \sprintf('swag_paypal_%s', $fileName);

        $this->fileSaver->persistFileToMedia(
            $mediaFile,
            $savedFileName,
            $this->getMediaId($savedFileName, $paymentMethod, $context),
            $context
        );
    }

    private function getMediaDefaultFolderId(Context $context): ?string
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('media_folder.defaultFolder.entity', $this->paymentMethodRepository->getDefinition()->getEntityName()));
        $criteria->addAssociation('defaultFolder');
        $criteria->setLimit(1);

        return $this->mediaFolderRepository->searchIds($criteria, $context)->firstId();
    }

    private function getMediaId(string $fileName, PaymentMethodEntity $paymentMethod, Context $context): string
    {
        $media = $paymentMethod->getMedia();
        if ($media !== null && $media->getFileName() === $fileName) {
            return $media->getId();
        }

        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('fileName', $fileName));
        $mediaId = $this->mediaRepository->searchIds($criteria, $context)->firstId();

        if ($mediaId === null) {
            $mediaId = Uuid::randomHex();
        }

        $this->paymentMethodRepository->update(
            [[
                'id' => $paymentMethod->getId(),
                'media' => [
                    'id' => $mediaId,
                    'mediaFolderId' => $this->getMediaDefaultFolderId($context),
                ],
            ]],
            $context
        );

        return $mediaId;
    }

    private function getMediaFile(string $fileName): MediaFile
    {
        $filePath = \sprintf('%s/%s/%s.svg', \dirname(__DIR__, 3), self::PAYMENT_METHOD_MEDIA_DIR, $fileName);

        return new MediaFile(
            $filePath,
            \mime_content_type($filePath) ?: '',
            \pathinfo($filePath, \PATHINFO_EXTENSION),
            \filesize($filePath) ?: 0
        );
    }
}
