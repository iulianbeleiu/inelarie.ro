<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Test\Mock\PayPal\Client;

use Psr\Log\LoggerInterface;
use Swag\PayPal\RestApi\Client\CredentialsClient;
use Swag\PayPal\RestApi\Client\CredentialsClientFactory;

class CredentialsClientFactoryMock extends CredentialsClientFactory
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
        parent::__construct($logger);
    }

    public function createCredentialsClient(string $url): CredentialsClient
    {
        return new CredentialsClientMock($url, $this->logger);
    }
}
