<?php

declare(strict_types=1);

namespace Swag\Markets\Controller\Api;

use Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSettings\MarketplaceSettingsEntity;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Shopware\Core\System\Country\CountryEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Constraints\Country;

/**
 * Class MarketplaceController
 * @package SwagMarkets\Controller\Api
 * @RouteScope(scopes={"api"})
 */
class MarketplaceController extends AbstractController
{
    /**
     * @Route(
     *     "api/marketplace",
     *     name="api.bf-marketplace.create",
     *     methods={"POST"}
     * )
     *
     * @return JsonResponse
     */
    public function create(): JsonResponse
    {
        $repository = $this->container->get('bf_marketplace.repository');

        $result = $repository->create(
            [
                ['name' => 'Amazon DACH'],
                ['name' => 'Amazon IT']
            ],
            Context::createDefaultContext()
        );

        return new JsonResponse([$result], 200);
    }

    /**
     * @Route(
     *     "api/marketplace-settings",
     *     name="api.bf-marketplace-settings.create",
     *     methods={"POST"}
     * )
     *
     * @return JsonResponse
     */
    public function createSettings(): JsonResponse
    {
        $repository = $this->container->get('bf_marketplace_settings.repository');

        $result = $repository->create(
            [
                [
                    'bfMarketplaceId' => '3cbadbd7d7bd4f32bfc62b8b55494536',
                    'countryId' => 'd96b95a77c464878b85aaeb36f332f25',
                    'currencyId' => '87fa8d065961450095fd1c7f5c4267d0',
                    'languageId' => '2fbb5fe2e29a4d70aa5854ce7ce3e20b'
                ],
                [
                    'bfMarketplaceId' => '3cbadbd7d7bd4f32bfc62b8b55494536',
                    'countryId' => '575340e5b93e4cab8bd47058ecde5389',
                    'currencyId' => 'd487703598434483aea8d7e21be2a664',
                    'languageId' => '7fb9f3d837864a2a87c67680d55b750d'
                ],
            ],
            Context::createDefaultContext()
        );

        return new JsonResponse([$result], 200);
    }


    /**
     * @Route(
     *     "/api/marketplace",
     *     name="api.bf-marketplace.get",
     *     methods={"GET"}
     * )
     *
     * @return JsonResponse
     */
    public function getAll(): JsonResponse
    {
        /**
         * @var EntityRepositoryInterface $repository
         */
        $repository = $this->container->get('bf_marketplace.repository');
        $entities   = $repository->search(new Criteria(), Context::createDefaultContext());

        return new JsonResponse(
            [
                $entities
            ], 200
        );
    }

    /**
     * @Route(
     *     "/api/marketplace-settings",
     *     name="api.bf-marketplace-settings.get",
     *     methods={"GET"}
     * )
     *
     * @return JsonResponse
     */
    public function getAllSettings(): JsonResponse
    {
        /**
         * @var EntityRepositoryInterface $repository
         */
        $repository = $this->container->get('bf_marketplace_settings.repository');

        $entities = $repository->search(new Criteria(), Context::createDefaultContext());

        return new JsonResponse(
            [
                $entities
            ], 200
        );
    }
}
