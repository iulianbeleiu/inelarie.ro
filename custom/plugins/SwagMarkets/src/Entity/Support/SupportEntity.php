<?php declare(strict_types=1);

namespace Swag\Markets\Entity\Support;

use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Symfony\Component\Validator\Constraints as Assert;

class SupportEntity extends Entity
{
    /**
     * @var string
     * @Assert\NotBlank
     */
    protected $salutationId;

    /**
     * @var string
     */
    protected $salutation;

    /**
     * @var string
     * @Assert\NotBlank
     */
    protected $name;

    /**
     * @var string
     * @Assert\NotBlank
     */
    protected $company;

    /**
     * @var string
     * @Assert\NotBlank
     * @Assert\Email(
     *     message = "The email '{{ value }}' is not a valid email."
     * )
     */
    protected $email;

    /**
     * @var string
     * @Assert\Length(
     *     min = 8,
     *     max = 20,
     *     minMessage = "Min length must be 8 characters",
     *     maxMessage = "Max length must be 20 characters"
     * )
     * @Assert\Regex(pattern="/^[^a-zA-Z]*$/", message="Phone number is not valid")
     */
    protected $phoneNumber;

    /**
     * @var string
     */
    protected $message;

    /**
     * @var string
     */
    protected $marketplace;

    /**
     * @var string
     */
    protected $domain;

    /**
     * @var string
     */
    protected $customerIdentifier;

    /**
     * @var string
     */
    protected $salesChannelId;

    /**
     * @var string
     */
    protected $requestSubject;

    /**
     * @var string
     */
    protected $languageCode;

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    /**
     * @return string
     */
    public function getSalutationId(): string
    {
        return $this->salutationId;
    }

    /**
     * @param string $salutationId
     */
    public function setSalutationId(string $salutationId): void
    {
        $this->salutationId = $salutationId;
    }

    /**
     * @return string
     */
    public function getCompany(): string
    {
        return $this->company;
    }

    /**
     * @param string $company
     */
    public function setCompany(string $company): void
    {
        $this->company = $company;
    }

    /**
     * @return string
     */
    public function getEmail(): string
    {
        return $this->email;
    }

    /**
     * @param string $email
     */
    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    /**
     * @return string
     */
    public function getPhoneNumber(): string
    {
        return $this->phoneNumber;
    }

    /**
     * @param string $phoneNumber
     */
    public function setPhoneNumber(string $phoneNumber): void
    {
        $this->phoneNumber = $phoneNumber;
    }

    /**
     * @return string
     */
    public function getMessage(): string
    {
        return $this->message;
    }

    /**
     * @param string $message
     */
    public function setMessage(string $message): void
    {
        $this->message = $message;
    }

    /**
     * @return string
     */
    public function getMarketplace(): string
    {
        return $this->marketplace;
    }

    /**
     * @param string $marketplace
     */
    public function setMarketplace(string $marketplace): void
    {
        $this->marketplace = $marketplace;
    }

    /**
     * @return string
     */
    public function getDomain(): string
    {
        return $this->domain;
    }

    /**
     * @param string $domain
     */
    public function setDomain(string $domain): void
    {
        $this->domain = $domain;
    }

    /**
     * @return string
     */
    public function getCustomerIdentifier(): string
    {
        return $this->customerIdentifier;
    }

    /**
     * @param string $customerIdentifier
     */
    public function setCustomerIdentifier(string $customerIdentifier): void
    {
        $this->customerIdentifier = $customerIdentifier;
    }

    /**
     * @return string
     */
    public function getSalesChannelId(): string
    {
        return $this->salesChannelId;
    }

    /**
     * @param string $salesChannelId
     */
    public function setSalesChannelId(string $salesChannelId): void
    {
        $this->salesChannelId = $salesChannelId;
    }

    /**
     * @return string
     */
    public function getRequestSubject(): string
    {
        return $this->requestSubject;
    }

    /**
     * @param string $requestSubject
     */
    public function setRequestSubject(string $requestSubject): void
    {
        $this->requestSubject = $requestSubject;
    }

    /**
     * @return string
     */
    public function getSalutation(): string
    {
        return $this->salutation;
    }

    /**
     * @param string $salutation
     */
    public function setSalutation(string $salutation): void
    {
        $this->salutation = $salutation;
    }

    /**
     * @return string
     */
    public function getLanguageCode(): string
    {
        return $this->languageCode;
    }

    /**
     * @param string $languageCode
     */
    public function setLanguageCode(string $languageCode): void
    {
        $this->languageCode = $languageCode;
    }
}
