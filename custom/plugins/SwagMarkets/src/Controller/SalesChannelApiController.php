<?php

namespace Swag\Markets\Controller;

use Exception;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Exception\InconsistentCriteriaIdsException;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Class SalesChannelApiController
 *
 * @RouteScope(scopes={"api"})
 *
 * @package SwagMarkets\Controller
 *
 */
class SalesChannelApiController extends AbstractController
{
    /**
     * @Route("/api/swagMarkets/sales-channel-type/{id}", name="bf.sales.channel.type", methods={"GET"}, requirements={"id"="[0-9a-f]{32}"})
     *
     * @param Context $context
     * @param string $id
     *
     * @return JsonResponse
     * @throws InconsistentCriteriaIdsException
     */
    public function getSalesChannelById(Request $request, Context $context, string $id)
    {
        $salesChannelRepository = $this->container->get('sales_channel.repository');
        $salesChannelTypeRepository = $this->container->get('sales_channel_type.repository');

        $salesChannel = $salesChannelRepository->search(new Criteria([$id]), $context)->get($id);
        $salesChannelType = $salesChannelTypeRepository->search(
            new Criteria([$salesChannel->getTypeId()]),
            $context
        )->first();

        return new JsonResponse(
            [
                'data' => ($salesChannelType->getTranslated()['name'] === $request->get(
                        'name'
                    ) && $salesChannelType->getTranslated()['manufacturer'] === "swagMarkets GmbH")
            ], 200
        );
    }

    /**
     * @Route("/api/swagMarkets/sales-channel-type/load/{id}", name="bf.sales.channel.type", methods={"GET"}, requirements={"id"="[0-9a-f]{32}"})
     *
     * @param Context $context
     * @param string $id
     *
     * @return JsonResponse
     * @throws InconsistentCriteriaIdsException
     */
    public function getSalesChannelTypeById(Request $request, Context $context, string $id)
    {
        $salesChannelRepository     = $this->container->get('sales_channel.repository');
        $salesChannelTypeRepository = $this->container->get('sales_channel_type.repository');

        $salesChannel     = $salesChannelRepository->search(new Criteria([$id]), $context)->get($id);

        if ($salesChannel === null) {
            return new JsonResponse(['data' => [], 200]);
        }

        $salesChannelType = $salesChannelTypeRepository->search(new Criteria([$salesChannel->getTypeId()]), $context)->first();

        return new JsonResponse(
            ['data' => $salesChannelType->getTranslated()['name']],
            200
        );
    }

    /**
     * @Route("/api/swagMarkets/sales-channel-language/save", name="bf.sales.channel.language", methods={"POST"})
     * @param Request $request
     * @param Context $context
     *
     * @return JsonResponse
     */
    public function saveSalesChannelLanguage(Request $request, Context $context): JsonResponse
    {
        try {
            /** @var EntityRepositoryInterface $salesChannelLanguageRepository */
            $salesChannelLanguageRepository = $this->container->get('sales_channel_language.repository');
            $salesChannelLanguageRepository->upsert([$request->request->all()], $context);
            return new JsonResponse(['success' => true], 201);
        } catch (Exception $exception) {
            return new JsonResponse(['success' => false, 'message' => $exception->getMessage()], 500);
        }
    }

    /**
     * @Route("/api/swagMarkets/sales-channel-country/save", name="bf.sales.channel.country", methods={"POST"})
     * @param Request $request
     * @param Context $context
     *
     * @return JsonResponse
     */
    public function saveSalesChannelCountry(Request $request, Context $context): JsonResponse
    {
        try {
            /** @var EntityRepositoryInterface $salesChannelCountryRepository */
            $salesChannelCountryRepository = $this->container->get('sales_channel_country.repository');
            $salesChannelCountryRepository->upsert([$request->request->all()], $context);
            return new JsonResponse(['success' => true], 201);
        } catch (Exception $exception) {
            return new JsonResponse(['success' => false, 'message' => $exception->getMessage()], 500);
        }
    }

    /**
     * @Route("/api/swagMarkets/sales-channel-currency/save", name="bf.sales.channel.currency", methods={"POST"})
     * @param Request $request
     * @param Context $context
     *
     * @return JsonResponse
     */
    public function saveSalesChannelCurrency(Request $request, Context $context): JsonResponse
    {
        try {
            /** @var EntityRepositoryInterface $salesChannelCountryRepository */
            $salesChannelCurrencyRepository = $this->container->get('sales_channel_currency.repository');
            $salesChannelCurrencyRepository->upsert([$request->request->all()], $context);
            return new JsonResponse(['success' => true], 201);
        } catch (Exception $exception) {
            return new JsonResponse(['success' => false, 'message' => $exception->getMessage()], 500);
        }
    }
}
