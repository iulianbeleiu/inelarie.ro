<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\RestApi\V1\Api\Disputes\Item;

use OpenApi\Annotations as OA;
use Swag\PayPal\RestApi\PayPalApiStruct;
use Swag\PayPal\RestApi\V1\Api\Disputes\Item\Evidence\Document;
use Swag\PayPal\RestApi\V1\Api\Disputes\Item\Evidence\EvidenceInfo;

/**
 * @OA\Schema(schema="swag_paypal_v1_disputes_evidence")
 */
class Evidence extends PayPalApiStruct
{
    /**
     * @OA\Property(type="string")
     */
    protected string $evidenceType;

    /**
     * @OA\Property(ref="#/components/schemas/swag_paypal_v1_disputes_evidence_info")
     */
    protected EvidenceInfo $evidenceInfo;

    /**
     * @var Document[]
     * @OA\Property(type="array", items={"$ref": "#/components/schemas/swag_paypal_v1_disputes_evidence_document"})
     */
    protected array $documents;

    /**
     * @OA\Property(type="string")
     */
    protected string $notes;

    /**
     * @OA\Property(type="string")
     */
    protected string $itemId;

    public function getEvidenceType(): string
    {
        return $this->evidenceType;
    }

    public function setEvidenceType(string $evidenceType): void
    {
        $this->evidenceType = $evidenceType;
    }

    public function getEvidenceInfo(): EvidenceInfo
    {
        return $this->evidenceInfo;
    }

    public function setEvidenceInfo(EvidenceInfo $evidenceInfo): void
    {
        $this->evidenceInfo = $evidenceInfo;
    }

    /**
     * @return Document[]
     */
    public function getDocuments(): array
    {
        return $this->documents;
    }

    /**
     * @param Document[] $documents
     */
    public function setDocuments(array $documents): void
    {
        $this->documents = $documents;
    }

    public function getNotes(): string
    {
        return $this->notes;
    }

    public function setNotes(string $notes): void
    {
        $this->notes = $notes;
    }

    public function getItemId(): string
    {
        return $this->itemId;
    }

    public function setItemId(string $itemId): void
    {
        $this->itemId = $itemId;
    }
}
