<?php

namespace Deployer;

require_once 'recipe/common.php';

set('application', 'Shopware 6');
set('allow_anonymous_stats', false);
set('default_timeout', 3600); // Increase the `default_timeout`, if needed, when tasks take longer than the limit.

// For more information, please visit the Deployer docs: https://deployer.org/docs/configuration.html
host('172.104.137.128')
	->stage('production')
	->user('root')->become('www-data')
	->set('deploy_path', '/var/www/inelarie.ro')
	->set('http_user', 'www-data')
	->set('writable_mode', 'chmod');

// For more information, please visit the Deployer docs: https://deployer.org/docs/configuration.html#shared_files
set('shared_files', [
	'.env',
]);

// For more information, please visit the Deployer docs: https://deployer.org/docs/configuration.html#shared_dirs
set('shared_dirs', [
	'custom/plugins',
	'config/jwt',
	'files',
	'var/log',
	'public/media',
	'public/thumbnail',
	'public/sitemap',
]);

// For more information, please visit the Deployer docs: https://deployer.org/docs/configuration.html#writable_dirs
set('writable_dirs', [
	'custom/plugins',
	'config/jwt',
	'files',
	'public/bundles',
	'public/css',
	'public/fonts',
	'public/js',
	'public/media',
	'public/sitemap',
	'public/theme',
	'public/thumbnail',
	'var',
]);

// This task uploads the whole workspace to the target server
task('deploy:update_code', static function () {
	upload('.', '{{release_path}}');
});

// This task remotely creates the `install.lock` file on the target server.
task('sw:touch_install_lock', static function () {
	run('cd {{release_path}} && touch install.lock');
});

// This task remotely executes the `bin/build-js.sh` script on the target server.
task('sw:build', static function () {
	run('cd {{release_path}} && bash bin/build-js.sh');
});

// This task remotely executes the `theme:compile` console command on the target server.
task('sw:theme:compile', static function () {
	run('cd {{release_path}} && bin/console theme:compile');
});

// This task remotely executes the `cache:clear` console command on the target server.
task('sw:cache:clear', static function () {
	run('cd {{release_path}} && bin/console cache:clear');
});

// This task remotely executes the cache warmup console commands on the target server, so that the first user, who
// visits the website, doesn't have to wait for the cache to be built up.
task('sw:cache:warmup', static function () {
	run('cd {{release_path}} && bin/console cache:warmup');
	run('cd {{release_path}} && bin/console http:cache:warm:up');
});

// This task remotely executes the `database:migrate` console command on the target server.
task('sw:database:migrate', static function () {
	run('cd {{release_path}} && bin/console database:migrate --all');
});

/**
 * Grouped SW deploy tasks
 */
task('sw:deploy', [
	'sw:touch_install_lock',
	'sw:build',
	'sw:database:migrate',
	'sw:theme:compile',
	'sw:cache:clear',
]);

/**
 * Main task
 */
task('deploy', [
	'deploy:prepare',
	'deploy:lock',
	'deploy:release',
	'deploy:update_code',
	'deploy:shared',
	'sw:deploy',
	'deploy:writable',
	'deploy:clear_paths',
	'sw:cache:warmup',
	'deploy:symlink',
	'deploy:unlock',
	'cleanup',
	'success',
])->desc('Deploy your project');

after('deploy:failed', 'deploy:unlock');