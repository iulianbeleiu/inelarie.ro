<?php declare(strict_types=1);

namespace Swag\Markets\Controller;

use Swag\Markets\Controller\Api\ConfigController;
use Swag\Markets\Entity\Support\SupportEntity;
use Exception;
use Shopware\Core\Content\Mail\Service\MailService;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Shopware\Core\Framework\Validation\DataBag\DataBag;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use stdClass;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\Validator\ValidatorInterface;


/**
 * Class SupportRequestController
 *
 * @RouteScope(scopes={"api"})
 *
 * @package SwagMarkets\Controller
 *
 */
class SupportRequestController extends AbstractController
{
    /** @var string */
    private const SUPPORT_MAIL_ADDRESS = 'info@brickfox.de';

    /** @var MailService $mailService*/
    private $mailService;

    /** @var SystemConfigService $systemConfigService */
    private $systemConfigService;

    /** @var EntityRepositoryInterface $configRepository */
    private $configRepository;

    /** @var EntityRepositoryInterface $salutationRepository */
    private $salutationRepository;

    /** @var ConfigController $configController */
    private $configController;

    public function __construct(
        MailService $mailService,
        SystemConfigService $systemConfigService,
        ConfigController $configController,
        EntityRepositoryInterface $salutationRepository
    )
    {
        $this->mailService = $mailService;
        $this->systemConfigService = $systemConfigService;
        $this->salutationRepository = $salutationRepository;
        $this->configController = $configController;
    }

    /**
     * @Route("/api/swagMarkets/send-support-request", name="bf.support.request", methods={"POST"})
     *
     * @param Request $request
     * @param ValidatorInterface $validator
     * @return JsonResponse
     */
    public function send(Request $request, ValidatorInterface $validator): JsonResponse
    {
        $responseArray = [];

        $supportEntity = $this->mapSupportEntity($request->request->all());
        $errors = $validator->validate($supportEntity);

        if (count($errors) > 0) {
            foreach ($errors as $error) {
                $responseArray[] = $this->prepareError($error);
            }
        } else {
            try {
                $supportEntity->setSalutation($this->getSalutationById($supportEntity->getSalutationId()));
                $data = $this->prepareMailData($supportEntity);

                $this->mailService->send($data->all(), Context::createDefaultContext());

                $requestType = $request->get('requestType');

                if (!empty($requestType)) {
                    $this->setRequestTypeForMarketplace($supportEntity->getMarketplace(), $requestType, true);
                }

                $responseArray = $this->prepareResponse(
                    201,
                    'Request was sent on address: ' . self::SUPPORT_MAIL_ADDRESS
                );
            } catch (Exception $exception) {
                // TODO: log errors

                $responseArray = $this->prepareResponse(
                    $exception->getCode(),
                    'Error happens',
                    $exception->getMessage()
                );
            }
        }

        return new JsonResponse(
            $responseArray,
            count($errors) === 0 && $responseArray['code'] === 201 ? 201 : 400
        );
    }

    /**
     * @param int $code
     * @param string $message
     * @param string $error
     * @return array
     */
    private function prepareResponse(int $code, string $message, string $error = ''): array
    {
        return [
            'code' => $code,
            'status' => $code === 200 ? 'ok' : 'error',
            'message' => $message,
            'error' => $error
        ];
    }

    /**
     * @param ConstraintViolation $error
     * @return stdClass
     */
    private function prepareError(ConstraintViolation $error): stdClass
    {
        $errorClass = new stdClass();

        $errorClass->code = $error->getCode();
        $errorClass->message = $error->getMessage();
        $errorClass->messageTemplate = $error->getMessageTemplate();
        $errorClass->parameters = $error->getParameters();
        $errorClass->propertyPath = $error->getPropertyPath();
        $errorClass->invalidValue = $error->getInvalidValue();

        return $errorClass;
    }

    /**
     * @param array $requestData
     * @return SupportEntity
     */
    private function mapSupportEntity(array $requestData): SupportEntity
    {
        $support = new SupportEntity();

        $support->setSalutationId($requestData['salutationId']);
        $support->setLanguageCode($requestData['languageCode']);
        $support->setName($requestData['name']);
        $support->setCompany($requestData['company']);
        $support->setEmail($requestData['email']);
        $support->setPhoneNumber($requestData['phoneNumber']);
        $support->setMessage($requestData['message']);
        $support->setSalesChannelId($requestData['salesChannelId']);
        $support->setRequestSubject($requestData['requestSubject']);
        $support->setMarketplace($requestData['marketplace']);

        $support->setDomain($this->systemConfigService->get('core.store.licenseHost'));
        $support->setCustomerIdentifier($this->configController->getUserShopId());

        return $support;
    }

    /**
     * @param SupportEntity $supportEntity
     * @return DataBag
     */
    private function prepareMailData(SupportEntity $supportEntity): DataBag
    {
        $senderName = sprintf('%s (%s)', $supportEntity->getName(), $supportEntity->getCompany());

        $subject = sprintf(
            'SW6 | %s | %s | %s',
            $supportEntity->getRequestSubject(),
            $supportEntity->getMarketplace(),
            $supportEntity->getCompany()
        );

        $body = $this->prepareMailBody($supportEntity);

        $data = new DataBag();
        $data->set('recipients', [self::SUPPORT_MAIL_ADDRESS => $supportEntity->getName()]);
        $data->set('senderName', $senderName);
        $data->set('salesChannelId', $supportEntity->getSalesChannelId());

        $data->set('contentHtml', $body);
        $data->set('contentPlain', $body);
        $data->set('subject', $subject);
        $data->set('mediaIds', []);

        return $data;
    }

    /**
     * @param SupportEntity $supportEntity
     * @return string
     */
    private function prepareMailBody(SupportEntity $supportEntity): string
    {
        $body = '<strong>Customer identifier:</strong> ' . $supportEntity->getCustomerIdentifier();
        $body .= '<br><strong>Domain:</strong> ' . $supportEntity->getDomain();
        $body .= '<br><strong>Language code:</strong> ' . $supportEntity->getLanguageCode();
        $body .= '<br><strong>Salutation:</strong> ' . $supportEntity->getSalutation();
        $body .= '<br><strong>Name:</strong> ' . $supportEntity->getName();
        $body .= '<br><strong>Company:</strong> ' . $supportEntity->getCompany();
        $body .= '<br><strong>Email:</strong> ' . $supportEntity->getEmail();
        $body .= '<br><strong>Phone:</strong> ' . $supportEntity->getPhoneNumber();
        $body .= '<br><strong>Message:</strong> ' . $supportEntity->getMessage();

        return $body;
    }

    /**
     * @param string $salutationId
     * @return string
     */
    private function getSalutationById(string $salutationId): string
    {
        $salutationEntity = $this->salutationRepository->search(
            (new Criteria())->addFilter(new EqualsFilter('id', $salutationId)),
            Context::createDefaultContext()
        );

        return $salutationEntity->first()->getDisplayName();
    }

    /**
     * @param string $marketplace
     * @param string $requestType
     * @param bool $value
     * @return void
     */
    private function setRequestTypeForMarketplace(string $marketplace, string $requestType, bool $value = false): void
    {
        $configKey = $marketplace . '_configuration';

        $this->configController->setConfigAttribute($configKey, $requestType, $value);
    }
}
