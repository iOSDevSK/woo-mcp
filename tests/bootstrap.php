<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package Wordpress_Mcp
 */

$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

// Forward custom PHPUnit Polyfills configuration to PHPUnit bootstrap file.
$_phpunit_polyfills_path = getenv( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH' );
if ( false !== $_phpunit_polyfills_path ) {
	define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', $_phpunit_polyfills_path );
}

if ( ! file_exists( "{$_tests_dir}/includes/functions.php" ) ) {
	echo "Could not find {$_tests_dir}/includes/functions.php, have you run bin/install-wp-tests.sh ?" . PHP_EOL; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
}

// Give access to tests_add_filter() function.
require_once "{$_tests_dir}/includes/functions.php";

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	// enable MCP in settings.
	update_option(
		'wordpress_mcp_settings',
		array(
			'enabled'                  => true,
			'enable_create_tools'      => true,
			'enable_update_tools'      => true,
			'enable_delete_tools'      => true,
			'features_adapter_enabled' => true,
		)
	);

	// Enable WooCommerce if it exists.
	if ( file_exists( WP_PLUGIN_DIR . '/woocommerce/woocommerce.php' ) ) {
		activate_plugin( 'woocommerce/woocommerce.php' );
	}

	$woocommerce_path = dirname( dirname( __DIR__ ) ) . '/woocommerce/woocommerce.php';

	if ( file_exists( $woocommerce_path ) ) {
		// Activate WooCommerce.
		require_once $woocommerce_path;
	}

	// Load FeaturesAPI plugin if it exists.
	// $features_api_path = dirname( dirname( __DIR__ ) ) . '/wp-feature-api/wp-feature-api.php';

	// if ( file_exists( $features_api_path ) ) {
	// Activate FeaturesAPI.
	// require_once $features_api_path;
	// }

	// Load the plugin.
	require_once dirname( __DIR__ ) . '/wordpress-mcp.php';
}

tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start up the WP testing environment.
require "{$_tests_dir}/includes/bootstrap.php";
