<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Pos\Schedule;

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\System\SalesChannel\SalesChannelEntity;
use Swag\PayPal\Pos\Run\Task\CompleteTask;

class CompleteSyncTaskHandler extends AbstractSyncTaskHandler
{
    private CompleteTask $completeTask;

    public function __construct(
        EntityRepositoryInterface $scheduledTaskRepository,
        EntityRepositoryInterface $salesChannelRepository,
        CompleteTask $completeTask
    ) {
        parent::__construct($scheduledTaskRepository, $salesChannelRepository);
        $this->completeTask = $completeTask;
    }

    public static function getHandledMessages(): iterable
    {
        return [CompleteSyncTask::class];
    }

    protected function executeTask(SalesChannelEntity $salesChannel, Context $context): void
    {
        $this->completeTask->execute($salesChannel, $context);
    }
}
