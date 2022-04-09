<?php

namespace Swag\Markets\Controller;

use Exception;
use Swag\Markets\Service\SwagMarketsService;
use Swag\Markets\Setup\Install;
use Shopware\Core\Framework\Api\Controller\ApiController;
use Shopware\Core\Framework\Api\Response\ResponseFactoryInterface;
use Shopware\Core\Framework\Api\Util\AccessKeyHelper;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Class SwagMarketsController
 * @package SwagMarkets\Controller
 *
 * @RouteScope(scopes={"api"})
 * @Route(
 *     "api/swagMarkets",
 *     name="bf."
 * )
 */
class SwagMarketsController extends AbstractController
{
    /**
     * @var SwagMarketsService $swagMarketsService
     */
    private $swagMarketsService;

    /** @var EntityRepositoryInterface $productToDeleteRepository */
    private $productToDeleteRepository;

    /**
     *
     * @param SwagMarketsService $swagMarketsService
     * @param EntityRepositoryInterface $productToDeleteRepository
     */
    public function __construct(SwagMarketsService $swagMarketsService, EntityRepositoryInterface $productToDeleteRepository)
    {
        $this->swagMarketsService = $swagMarketsService;
        $this->productToDeleteRepository = $productToDeleteRepository;
    }

    /**
     * @Route("/variations", name="get", methods={"GET"})
     * @return JsonResponse
     */
    public function getUsedVariations() : JsonResponse
    {
        try {
            $result = $this->swagMarketsService->getVariationsUsedByProducts();

            return new JsonResponse(
                [
                    'success' => true,
                    'data' => $result
                ], 200
            );
        } catch (Exception $e) {
            return new JsonResponse(
                [
                    'success' => false,
                    'data' => [

                        'message' => $e->getMessage(),
                    ]
                ], 500
            );
        }
    }

    /**
     * @Route("/toDeleteProducts", name="get.to.delete.products", methods={"GET"})
     *
     * @param Context $context
     * @return JsonResponse
     */
    public function getToDeleteProducts(Context $context): JsonResponse
    {
        try {
            $result = $this->swagMarketsService->getToDeleteProducts($context, $this->productToDeleteRepository);
            return new JsonResponse(['success' => true, 'data' => $result], 200);
        } catch (Exception $e) {
            return new JsonResponse(
                ['success' => false, 'data' => ['message' => $e->getMessage(),]]
            );
        }
    }

    /**
     * @Route("/toDeleteProducts", name="delete.to.delete.products", methods={"DELETE"})
     *
     * @param Context $context
     * @return JsonResponse
     */
    public function deleteToDeleteProducts(Context $context, Request $request): JsonResponse
    {
        try {
            return new JsonResponse([
                'success' => $this->swagMarketsService->removeToDeleteProducts(
                    $context, $this->productToDeleteRepository,
                    $request->request->all()
                )
            ]);
        } catch (Exception $e) {
            return new JsonResponse(
                ['success' => false, 'data' => ['message' => $e->getMessage(),]]
            );
        }
    }
}
