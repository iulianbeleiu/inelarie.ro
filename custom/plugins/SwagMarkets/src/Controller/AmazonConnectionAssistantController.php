<?php


namespace Swag\Markets\Controller;


use Swag\Markets\Service\ConfigService;
use Exception;
use http\Exception\InvalidArgumentException;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Class AmazonConnectionAssistantController
 *
 * @package SwagMarkets\Controller
 *
 * @RouteScope(scopes={"api"})
 * @Route(
 *     "/api/swagMarkets/amazon",
 *     name="bf.amazon.connection.assistant."
 * )
 */
class AmazonConnectionAssistantController extends AbstractController
{
    private $configService;

    /**
     * @param ConfigService $configService
     */
    public function __construct(ConfigService $configService)
    {
        $this->configService = $configService;
    }

    /**
     * @Route(
     *     "/finishConnectionAssistant",
     *      name="finishConnectionAssistant",
     *     methods={"POST"}
     * )
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function finishConnectionAssistant(Request $request):JsonResponse
    {
        try{

            if ($request->request->has('is_connected') === false) {
                throw new InvalidArgumentException("Missing required parameter", 500);
            }

            $data = [
                'configurationKey' => 'amazon_configuration',
                'data' => $request->request->all()
            ];

            $this->configService->singleStoreConfig($data);

            return new JsonResponse(['success' => true], 201);
        }catch (InvalidArgumentException|Exception $exception){
            return new JsonResponse(['success' => false,'message' => $exception->getMessage()],500);
        }
    }
}
