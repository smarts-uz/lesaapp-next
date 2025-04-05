-- Create bundle order with simple items
-- # DIFFERENT TABLE
-- ## INSERT ACTION
INSERT INTO
  `lesa_prod`.`wp_comments` (
    `comment_ID`,
    `comment_post_ID`,
    `comment_author`,
    `comment_author_email`,
    `comment_author_url`,
    `comment_author_IP`,
    `comment_date`,
    `comment_date_gmt`,
    `comment_content`,
    `comment_karma`,
    `comment_approved`,
    `comment_agent`,
    `comment_type`,
    `comment_parent`,
    `user_id`
  )
VALUES
  (
    52,
    139,
    'WooCommerce',
    'woocommerce@lesa.smarts.uz',
    '',
    '',
    '2025-04-03 10:37:07',
    '2025-04-03 10:37:07',
    'Stock hold of 60 minutes applied to: <br>- Nojka (#64) &times; 2<br>- Plus (#65) &times; 2<br>- Taxta (#15) &times; 2<br>- Plus (#65) &times; 3',
    0,
    '1',
    'WooCommerce',
    'order_note',
    0,
    0
  );

INSERT INTO
  `lesa_prod`.`wp_comments` (
    `comment_ID`,
    `comment_post_ID`,
    `comment_author`,
    `comment_author_email`,
    `comment_author_url`,
    `comment_author_IP`,
    `comment_date`,
    `comment_date_gmt`,
    `comment_content`,
    `comment_karma`,
    `comment_approved`,
    `comment_agent`,
    `comment_type`,
    `comment_parent`,
    `user_id`
  )
VALUES
  (
    53,
    139,
    'WooCommerce',
    'woocommerce@lesa.smarts.uz',
    '',
    '',
    '2025-04-03 10:37:08',
    '2025-04-03 10:37:08',
    'Stock levels reduced: Nojka (#64) 55&rarr;53, Plus (#65) 57&rarr;55, Taxta (#15) 54&rarr;52, Plus (#65) 55&rarr;54',
    0,
    '1',
    'WooCommerce',
    'order_note',
    0,
    0
  );

INSERT INTO
  `lesa_prod`.`wp_comments` (
    `comment_ID`,
    `comment_post_ID`,
    `comment_author`,
    `comment_author_email`,
    `comment_author_url`,
    `comment_author_IP`,
    `comment_date`,
    `comment_date_gmt`,
    `comment_content`,
    `comment_karma`,
    `comment_approved`,
    `comment_agent`,
    `comment_type`,
    `comment_parent`,
    `user_id`
  )
VALUES
  (
    54,
    139,
    'WooCommerce',
    'woocommerce@lesa.smarts.uz',
    '',
    '',
    '2025-04-03 10:37:08',
    '2025-04-03 10:37:08',
    'Payment to be made upon delivery. Order status changed from Pending payment to Processing.',
    0,
    '1',
    'WooCommerce',
    'order_note',
    0,
    0
  );

-- # DIFFERENT TABLE
-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_postmeta`
SET
  `meta_value`='51'
WHERE
  `post_id`=15
  AND `meta_key`='total_sales';

-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_postmeta`
SET
  `meta_value`='52'
WHERE
  `post_id`=15
  AND `meta_key`='_stock';

-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_postmeta`
SET
  `meta_value`='51'
WHERE
  `post_id`=64
  AND `meta_key`='total_sales';

-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_postmeta`
SET
  `meta_value`='53'
WHERE
  `post_id`=64
  AND `meta_key`='_stock';

-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_postmeta`
SET
  `meta_value`='50'
WHERE
  `post_id`=65
  AND `meta_key`='total_sales';

-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_postmeta`
SET
  `meta_value`='54'
WHERE
  `post_id`=65
  AND `meta_key`='_stock';

-- # DIFFERENT TABLE
-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_postmeta`
SET
  `meta_value`='26'
WHERE
  `post_id`=66
  AND `meta_key`='_wc_pb_bundle_stock_quantity';

-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_postmeta`
SET
  `meta_value`='24'
WHERE
  `post_id`=66
  AND `meta_key`='total_sales';

-- # DIFFERENT TABLE
-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_posts`
SET
  `post_modified`='2025-04-03 10:37:08',
  `post_modified_gmt`='2025-04-03 10:37:08'
WHERE
  `ID`=15;

-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_posts`
SET
  `post_modified`='2025-04-03 10:37:08',
  `post_modified_gmt`='2025-04-03 10:37:08'
WHERE
  `ID`=64;

UPDATE `lesa_prod`.`wp_posts`
SET
  `post_modified`='2025-04-03 10:37:08',
  `post_modified_gmt`='2025-04-03 10:37:08'
WHERE
  `ID`=65;

-- ## INSERT ACTION
INSERT INTO
  `lesa_prod`.`wp_posts` (
    `ID`,
    `post_author`,
    `post_date`,
    `post_date_gmt`,
    `post_content`,
    `post_title`,
    `post_excerpt`,
    `post_status`,
    `comment_status`,
    `ping_status`,
    `post_password`,
    `post_name`,
    `to_ping`,
    `pinged`,
    `post_modified`,
    `post_modified_gmt`,
    `post_content_filtered`,
    `post_parent`,
    `guid`,
    `menu_order`,
    `post_type`,
    `post_mime_type`,
    `comment_count`
  )
VALUES
  (
    139,
    0,
    '2025-04-03 10:37:07',
    '2025-04-03 10:37:07',
    '',
    '',
    '',
    'draft',
    'closed',
    'closed',
    '',
    '',
    '',
    '',
    '2025-04-03 10:37:07',
    '2025-04-03 10:37:07',
    '',
    0,
    'https://lesa.smarts.uz/?post_type=shop_order_placehold&p=139',
    0,
    'shop_order_placehold',
    '',
    3
  );

 
-- # DIFFERENT TABLE
-- ## INSERT ACTION
INSERT INTO
  `lesa_prod`.`wp_wc_order_addresses` (
    `id`,
    `order_id`,
    `address_type`,
    `first_name`,
    `last_name`,
    `company`,
    `address_1`,
    `address_2`,
    `city`,
    `state`,
    `postcode`,
    `country`,
    `email`,
    `phone`
  )
VALUES
  (
    27,
    139,
    'billing',
    'Dilbek',
    'Mukhtarovich',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '770700279'
  );

 
-- # DIFFERENT TABLE
-- ## INSERT ACTION
INSERT INTO
  `lesa_prod`.`wp_wc_order_operational_data` (
    `id`,
    `order_id`,
    `created_via`,
    `woocommerce_version`,
    `prices_include_tax`,
    `coupon_usages_are_counted`,
    `download_permission_granted`,
    `cart_hash`,
    `new_order_email_sent`,
    `order_key`,
    `order_stock_reduced`,
    `date_paid_gmt`,
    `date_completed_gmt`,
    `shipping_tax_amount`,
    `shipping_total_amount`,
    `discount_tax_amount`,
    `discount_total_amount`,
    `recorded_sales`
  )
VALUES
  (
    222,
    139,
    'checkout',
    '9.7.1',
    0,
    1,
    1,
    'ed7f04afddb28192f685d72255d8bcc0',
    1,
    'wc_order_Wk9vsSWDAuZUa',
    1,
    NULL,
    NULL,
    0.00000000,
    0.00000000,
    0.00000000,
    0.00000000,
    1
  );

 
-- # DIFFERENT TABLE
-- ## INSERT ACTION
INSERT INTO
  `lesa_prod`.`wp_wc_orders` (
    `id`,
    `status`,
    `currency`,
    `type`,
    `tax_amount`,
    `total_amount`,
    `customer_id`,
    `billing_email`,
    `date_created_gmt`,
    `date_updated_gmt`,
    `parent_order_id`,
    `payment_method`,
    `payment_method_title`,
    `transaction_id`,
    `ip_address`,
    `user_agent`,
    `customer_note`
  )
VALUES
  (
    139,
    'wc-processing',
    'UZS',
    'shop_order',
    0.00000000,
    7400.00000000,
    0,
    NULL,
    '2025-04-03 10:37:07',
    '2025-04-03 10:37:08',
    0,
    'cod',
    'Cash on delivery',
    '',
    '45.150.24.108',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    ''
  );

 
-- # DIFFERENT TABLE
-- ## INSERT ACTION
INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (337, 139, 'is_vat_exempt', 'no');

INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (
    338,
    139,
    '_billing_address_index',
    'Dilbek Mukhtarovich         770700279'
  );

INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (339, 139, '_shipping_address_index', '         ');

INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (
    340,
    139,
    '_wc_order_attribution_source_type',
    'typein'
  );

INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (
    341,
    139,
    '_wc_order_attribution_utm_source',
    '(direct)'
  );

INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (
    342,
    139,
    '_wc_order_attribution_session_entry',
    'https://lesa.smarts.uz/'
  );

INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (
    343,
    139,
    '_wc_order_attribution_session_start_time',
    '2025-04-03 08:27:27'
  );

INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (
    344,
    139,
    '_wc_order_attribution_session_pages',
    '18'
  );

INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (
    345,
    139,
    '_wc_order_attribution_session_count',
    '2'
  );

INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (
    346,
    139,
    '_wc_order_attribution_user_agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
  );

INSERT INTO
  `lesa_prod`.`wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`)
VALUES
  (
    347,
    139,
    '_wc_order_attribution_device_type',
    'Desktop'
  );

 
-- # DIFFERENT TABLE
-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_wc_product_meta_lookup`
SET
  `stock_quantity`=52,
  `total_sales`=51
WHERE
  `product_id`=15;

UPDATE `lesa_prod`.`wp_wc_product_meta_lookup`
SET
  `stock_quantity`=53,
  `total_sales`=51
WHERE
  `product_id`=64;

UPDATE `lesa_prod`.`wp_wc_product_meta_lookup`
SET
  `stock_quantity`=54,
  `total_sales`=50
WHERE
  `product_id`=65;

UPDATE `lesa_prod`.`wp_wc_product_meta_lookup`
SET
  `total_sales`=24
WHERE
  `product_id`=66;

 
-- # DIFFERENT TABLE
-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_woocommerce_bundled_itemmeta`
SET
  `meta_value`='52'
WHERE
  `bundled_item_id`=1
  AND `meta_key`='max_stock';

-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_woocommerce_bundled_itemmeta`
SET
  `meta_value`='54'
WHERE
  `bundled_item_id`=2
  AND `meta_key`='max_stock';

-- ## UPDATE ACTION
UPDATE `lesa_prod`.`wp_woocommerce_bundled_itemmeta`
SET
  `meta_value`='52'
WHERE
  `bundled_item_id`=3
  AND `meta_key`='max_stock';

 
-- # DIFFERENT TABLE
-- ## INSERT ACTION
INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1213, 95, '_product_id', '66');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1214, 95, '_variation_id', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1215, 95, '_qty', '1');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1216, 95, '_tax_class', '');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1217, 95, '_line_subtotal', '4500');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1218, 95, '_line_subtotal_tax', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1219, 95, '_line_total', '4500');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1220, 95, '_line_tax', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1221,
    95,
    '_line_tax_data',
    'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1222,
    95,
    '_bundled_items',
    'a:3:{i:0;s:32:\"afb67647b35d1240f34c0c881d63a341\";i:1;s:32:\"2b0b6109837e036631f8dc1c83c93eff\";i:2;s:32:\"af66c191dfd6ff276a4d18855fd7f34b\";}'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1223, 95, '_bundle_group_mode', 'parent');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1224,
    95,
    '_stamp',
    'a:3:{i:1;a:3:{s:10:\"product_id\";i:64;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}i:2;a:3:{s:10:\"product_id\";i:65;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}i:3;a:3:{s:10:\"product_id\";i:15;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}}'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1225,
    95,
    '_bundle_cart_key',
    '2d3cad3ee00f9d391db55a69f74b0ebe'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1226, 96, '_product_id', '64');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1227, 96, '_variation_id', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1228, 96, '_qty', '2');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1229, 96, '_tax_class', '');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1230, 96, '_line_subtotal', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1231, 96, '_line_subtotal_tax', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1232, 96, '_line_total', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1233, 96, '_line_tax', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1234,
    96,
    '_line_tax_data',
    'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1235,
    96,
    '_bundled_by',
    '2d3cad3ee00f9d391db55a69f74b0ebe'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1236, 96, '_bundled_item_id', '1');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1237,
    96,
    '_bundled_item_priced_individually',
    'no'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1238,
    96,
    '_stamp',
    'a:3:{i:1;a:3:{s:10:\"product_id\";i:64;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}i:2;a:3:{s:10:\"product_id\";i:65;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}i:3;a:3:{s:10:\"product_id\";i:15;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}}'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1239,
    96,
    '_bundle_cart_key',
    'afb67647b35d1240f34c0c881d63a341'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1240, 96, '_bundled_item_needs_shipping', 'yes');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1241, 97, '_product_id', '65');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1242, 97, '_variation_id', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1243, 97, '_qty', '2');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1244, 97, '_tax_class', '');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1245, 97, '_line_subtotal', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1246, 97, '_line_subtotal_tax', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1247, 97, '_line_total', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1248, 97, '_line_tax', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1249,
    97,
    '_line_tax_data',
    'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1250,
    97,
    '_bundled_by',
    '2d3cad3ee00f9d391db55a69f74b0ebe'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1251, 97, '_bundled_item_id', '2');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1252,
    97,
    '_bundled_item_priced_individually',
    'no'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1253,
    97,
    '_stamp',
    'a:3:{i:1;a:3:{s:10:\"product_id\";i:64;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}i:2;a:3:{s:10:\"product_id\";i:65;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}i:3;a:3:{s:10:\"product_id\";i:15;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}}'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1254,
    97,
    '_bundle_cart_key',
    '2b0b6109837e036631f8dc1c83c93eff'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1255, 97, '_bundled_item_needs_shipping', 'yes');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1256, 98, '_product_id', '15');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1257, 98, '_variation_id', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1258, 98, '_qty', '2');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1259, 98, '_tax_class', '');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1260, 98, '_line_subtotal', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1261, 98, '_line_subtotal_tax', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1262, 98, '_line_total', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1263, 98, '_line_tax', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1264,
    98,
    '_line_tax_data',
    'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1265,
    98,
    '_bundled_by',
    '2d3cad3ee00f9d391db55a69f74b0ebe'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1266, 98, '_bundled_item_id', '3');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1267,
    98,
    '_bundled_item_priced_individually',
    'no'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1268,
    98,
    '_stamp',
    'a:3:{i:1;a:3:{s:10:\"product_id\";i:64;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}i:2;a:3:{s:10:\"product_id\";i:65;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}i:3;a:3:{s:10:\"product_id\";i:15;s:8:\"quantity\";i:2;s:8:\"discount\";s:0:\"\";}}'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1269,
    98,
    '_bundle_cart_key',
    'af66c191dfd6ff276a4d18855fd7f34b'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1270, 98, '_bundled_item_needs_shipping', 'yes');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1271, 99, '_product_id', '65');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1272, 99, '_variation_id', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1273, 99, '_qty', '1');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1274, 99, '_tax_class', '');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1275, 99, '_line_subtotal', '2900');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1276, 99, '_line_subtotal_tax', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1277, 99, '_line_total', '2900');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1278, 99, '_line_tax', '0');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (
    1279,
    99,
    '_line_tax_data',
    'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}'
  );

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1280, 96, '_reduced_stock', '2');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1281, 97, '_reduced_stock', '2');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1282, 98, '_reduced_stock', '2');

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_itemmeta` (
    `meta_id`,
    `order_item_id`,
    `meta_key`,
    `meta_value`
  )
VALUES
  (1283, 99, '_reduced_stock', '1');

 
-- # DIFFERENT TABLE
-- ## INSERT ACTION
INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_items` (
    `order_item_id`,
    `order_item_name`,
    `order_item_type`,
    `order_id`
  )
VALUES
  (95, 'Lesa Komplekt', 'line_item', 139);

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_items` (
    `order_item_id`,
    `order_item_name`,
    `order_item_type`,
    `order_id`
  )
VALUES
  (96, 'Nojka', 'line_item', 139);

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_items` (
    `order_item_id`,
    `order_item_name`,
    `order_item_type`,
    `order_id`
  )
VALUES
  (97, 'Plus', 'line_item', 139);

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_items` (
    `order_item_id`,
    `order_item_name`,
    `order_item_type`,
    `order_id`
  )
VALUES
  (98, 'Taxta', 'line_item', 139);

INSERT INTO
  `lesa_prod`.`wp_woocommerce_order_items` (
    `order_item_id`,
    `order_item_name`,
    `order_item_type`,
    `order_id`
  )
VALUES
  (99, 'Plus', 'line_item', 139);

 