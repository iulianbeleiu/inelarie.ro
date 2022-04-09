<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use PackageVersions\Versions;
use Shopware\Core\Framework\Plugin\KernelPluginLoader\StaticKernelPluginLoader;
use Shopware\Development\Kernel;
use Swag\LanguagePack\SwagLanguagePack;
use Symfony\Component\Dotenv\Dotenv;

$classLoader = require __DIR__ . '/../../../../vendor/autoload.php';
(new Dotenv())->usePutEnv(true)->load(__DIR__ . '/../../../../.env');

$shopwareVersion = Versions::getVersion('shopware/platform');

$pluginRootPath = \dirname(__DIR__);
$composerJson = \json_decode((string) \file_get_contents($pluginRootPath . '/composer.json'), true);

$swagLanguagePack = [
    'autoload' => $composerJson['autoload'],
    'baseClass' => SwagLanguagePack::class,
    'managedByComposer' => false,
    'active' => true,
    'path' => $pluginRootPath,
    'name' => 'SwagLanguagePack',
    'version' => $composerJson['version']
];
$pluginLoader = new StaticKernelPluginLoader($classLoader, null, [$swagLanguagePack]);

$kernel = new Kernel('dev', true, $pluginLoader, $shopwareVersion);
$kernel->boot();
$projectDir = $kernel->getProjectDir();
$cacheDir = $kernel->getCacheDir();

$relativeCacheDir = \str_replace($projectDir, '', $cacheDir);

$phpStanConfigDist = \file_get_contents(__DIR__ . '/../phpstan.neon.dist');
if ($phpStanConfigDist === false) {
    throw new RuntimeException('phpstan.neon.dist file not found');
}

// because the cache dir is hashed by Shopware, we need to set the PHPStan config dynamically
$phpStanConfig = \str_replace(
    [
        "\n        # the placeholder \"%ShopwareHashedCacheDir%\" will be replaced on execution by bin/phpstan-config-generator.php script",
        '%ShopwareHashedCacheDir%',
    ],
    [
        '',
        $relativeCacheDir,
    ],
    $phpStanConfigDist
);

\file_put_contents(__DIR__ . '/../phpstan.neon', $phpStanConfig);
