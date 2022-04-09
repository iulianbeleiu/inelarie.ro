<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Test\Pos\Run;

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Swag\PayPal\Pos\Command\AbstractPosCommand;
use Swag\PayPal\Pos\Command\PosImageSyncCommand;
use Swag\PayPal\Pos\Command\PosInventorySyncCommand;
use Swag\PayPal\Pos\Command\PosLogCleanupCommand;
use Swag\PayPal\Pos\Command\PosProductSyncCommand;
use Swag\PayPal\Pos\Command\PosSyncCommand;
use Swag\PayPal\Pos\Command\PosSyncResetCommand;
use Swag\PayPal\Pos\MessageQueue\Handler\SyncManagerHandler;
use Swag\PayPal\Pos\MessageQueue\Message\SyncManagerMessage;
use Swag\PayPal\Pos\Run\Administration\LogCleaner;
use Swag\PayPal\Pos\Run\Administration\SyncResetter;
use Swag\PayPal\Pos\Run\RunService;
use Swag\PayPal\Pos\Run\Task\CompleteTask;
use Swag\PayPal\Pos\Run\Task\ImageTask;
use Swag\PayPal\Pos\Run\Task\InventoryTask;
use Swag\PayPal\Pos\Run\Task\ProductTask;
use Swag\PayPal\Test\Pos\Mock\MessageBusMock;
use Swag\PayPal\Test\Pos\Mock\Repositories\SalesChannelRepoMock;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\NullOutput;

class PosCommandTest extends TestCase
{
    private const INVALID_CHANNEL_ID = 'notASalesChannelId';

    private SalesChannelRepoMock $salesChannelRepoMock;

    /**
     * @var MockObject&RunService
     */
    private RunService $runService;

    private MockObject $logCleaner;

    private MockObject $syncResetter;

    /**
     * @var AbstractPosCommand[]
     */
    private array $commands;

    private MessageBusMock $messageBus;

    protected function setUp(): void
    {
        $this->salesChannelRepoMock = new SalesChannelRepoMock();
        $this->messageBus = new MessageBusMock();
        $this->runService = $this->createMock(RunService::class);
        $this->logCleaner = $this->createMock(LogCleaner::class);
        $this->syncResetter = $this->createMock(SyncResetter::class);

        $productTask = new ProductTask($this->messageBus, $this->runService);
        $imageTask = new ImageTask($this->messageBus, $this->runService);
        $inventoryTask = new InventoryTask($this->messageBus, $this->runService);
        $completeTask = new CompleteTask($this->messageBus, $this->runService);

        $this->commands = [
            PosSyncCommand::class => new PosSyncCommand($this->salesChannelRepoMock, $completeTask),
            PosImageSyncCommand::class => new PosImageSyncCommand($this->salesChannelRepoMock, $imageTask),
            PosInventorySyncCommand::class => new PosInventorySyncCommand($this->salesChannelRepoMock, $inventoryTask),
            PosProductSyncCommand::class => new PosProductSyncCommand($this->salesChannelRepoMock, $productTask),
            PosLogCleanupCommand::class => new PosLogCleanupCommand($this->salesChannelRepoMock, $this->logCleaner),
            PosSyncResetCommand::class => new PosSyncResetCommand($this->salesChannelRepoMock, $this->syncResetter),
        ];
    }

    public function dataProviderSyncFunctions(): array
    {
        return [
            [
                PosSyncCommand::class,
                [
                    SyncManagerHandler::SYNC_PRODUCT,
                    SyncManagerHandler::SYNC_IMAGE,
                    SyncManagerHandler::SYNC_PRODUCT,
                    SyncManagerHandler::SYNC_INVENTORY,
                ],
            ],
            [
                PosInventorySyncCommand::class,
                [
                    SyncManagerHandler::SYNC_INVENTORY,
                ],
            ],
            [
                PosProductSyncCommand::class,
                [
                    SyncManagerHandler::SYNC_PRODUCT,
                ],
            ],
            [
                PosImageSyncCommand::class,
                [
                    SyncManagerHandler::SYNC_IMAGE,
                ],
            ],
        ];
    }

    public function dataProviderFunctions(): array
    {
        return $this->dataProviderSyncFunctions() + [
            [
                PosLogCleanupCommand::class,
                null,
            ],
            [
                PosSyncResetCommand::class,
                null,
            ],
        ];
    }

    /**
     * @dataProvider dataProviderFunctions
     */
    public function testSyncWithInvalidId(string $commandClassName): void
    {
        $input = new ArrayInput(['salesChannelId' => self::INVALID_CHANNEL_ID]);
        static::assertSame(1, $this->commands[$commandClassName]->run($input, new NullOutput()));
    }

    /**
     * @dataProvider dataProviderFunctions
     */
    public function testSyncWithValidId(string $commandClassName): void
    {
        $input = new ArrayInput(['salesChannelId' => $this->salesChannelRepoMock->getMockEntity()->getId()]);
        static::assertSame(0, $this->commands[$commandClassName]->run($input, new NullOutput()));
    }

    /**
     * @dataProvider dataProviderSyncFunctions
     */
    public function testSyncNormal(string $commandClassName, array $serviceCalls): void
    {
        $input = new ArrayInput([]);

        static::assertSame(0, $this->commands[$commandClassName]->run($input, new NullOutput()));

        $envelope = \current($this->messageBus->getEnvelopes());
        static::assertNotFalse($envelope);
        /** @var SyncManagerMessage $message */
        $message = $envelope->getMessage();
        static::assertSame($serviceCalls, $message->getSteps());
    }

    public function testLogCleanup(): void
    {
        $this->logCleaner->expects(static::exactly($this->salesChannelRepoMock->getCollection()->count()))->method('cleanUpLog');
        $input = new ArrayInput([]);

        static::assertSame(0, $this->commands[PosLogCleanupCommand::class]->run($input, new NullOutput()));
    }

    public function testSyncReset(): void
    {
        $this->syncResetter->expects(static::exactly($this->salesChannelRepoMock->getCollection()->count()))->method('resetSync');
        $input = new ArrayInput([]);

        static::assertSame(0, $this->commands[PosSyncResetCommand::class]->run($input, new NullOutput()));
    }
}
