<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Checkout\SalesChannel;

use OpenApi\Annotations as OA;
use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\Plugin\Exception\DecorationPatternException;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Shopware\Core\Framework\Routing\Annotation\Since;
use Shopware\Core\System\SalesChannel\NoContentResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * @RouteScope(scopes={"store-api"})
 */
class ErrorRoute extends AbstractErrorRoute
{
    private Session $session;

    private TranslatorInterface $translator;

    private LoggerInterface $logger;

    public function __construct(Session $session, TranslatorInterface $translator, LoggerInterface $logger)
    {
        $this->session = $session;
        $this->translator = $translator;
        $this->logger = $logger;
    }

    public function getDecorated(): AbstractErrorRoute
    {
        throw new DecorationPatternException(self::class);
    }

    /**
     * @Since("3.3.0")
     * @OA\Post(
     *     path="/store-api/paypal/error",
     *     description="Adds an error message to a flashbag and logs the error",
     *     operationId="addErrorMessage",
     *     tags={"Store API", "PayPal"},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="error",
     *                 type="string",
     *                 description="Any content for the error message for logging"
     *             ),
     *             @OA\Property(
     *                 property="cancel",
     *                 type="string",
     *                 default=false,
     *                 description="Add an cancel warning instead of a full error message",
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *          response="204"
     *     )
     * )
     *
     * @Route(
     *     "/store-api/paypal/error",
     *     name="store-api.paypal.error",
     *     methods={"POST"},
     *     defaults={"XmlHttpRequest"=true}
     * )
     */
    public function addErrorMessage(Request $request): Response
    {
        if ($request->request->getBoolean('cancel')) {
            $this->session->getFlashBag()->add('warning', $this->translator->trans('paypal.general.paymentCancel'));
            $this->logger->notice('Storefront checkout cancellation');
        } else {
            $this->session->getFlashBag()->add('danger', $this->translator->trans('paypal.general.paymentError'));
            $this->logger->notice('Storefront checkout error', ['error' => $request->request->get('error')]);
        }

        return new NoContentResponse();
    }
}
