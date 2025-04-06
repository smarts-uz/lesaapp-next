-- WooCommerce Order Creation Process - Essential Queries in Sequence

-- 1. Create the order in wp_wc_orders table (main order data)
INSERT INTO `wp_wc_orders` (`id`,`status`,`currency`,`type`,`tax_amount`,`total_amount`,`customer_id`,`billing_email`,`date_created_gmt`,`date_updated_gmt`,`parent_order_id`,`payment_method`,`payment_method_title`,`transaction_id`,`ip_address`,`user_agent`,`customer_note`) 
VALUES (139, 'wc-processing', 'UZS', 'shop_order', 0.00000000, 10900.00000000, 0, NULL, '2025-04-02 15:01:09', '2025-04-02 15:01:12', 0, 'cod', 'Cash on delivery', '', '45.150.24.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36', '');

-- 2. Create order addresses
INSERT INTO `wp_wc_order_addresses` (`id`,`order_id`,`address_type`,`first_name`,`last_name`,`company`,`address_1`,`address_2`,`city`,`state`,`postcode`,`country`,`email`,`phone`) 
VALUES (27, 139, 'billing', '123', '13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '13');

-- 3. Add order items (products purchased)
INSERT INTO `wp_woocommerce_order_items` (`order_item_id`,`order_item_name`,`order_item_type`,`order_id`) 
VALUES 
(95, 'Lesa Komplekt', 'line_item', 139),
(96, 'Nojka', 'line_item', 139),
(97, 'Plus', 'line_item', 139),
(98, 'Taxta', 'line_item', 139),
(99, 'Nojka', 'line_item', 139);

-- 4. Add order meta data (order-level settings and flags)
INSERT INTO `wp_wc_orders_meta` (`id`,`order_id`,`meta_key`,`meta_value`) 
VALUES 
(337, 139, 'is_vat_exempt', 'no'),
(338, 139, '_billing_address_index', '123 13         13'),
(339, 139, '_shipping_address_index', '         ');

-- 5. Add item meta data (details for each ordered product)
-- Main bundle product
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) 
VALUES 
(1213, 95, '_product_id', '66'),
(1214, 95, '_variation_id', '0'),
(1215, 95, '_qty', '2'),
(1217, 95, '_line_subtotal', '9000'),
(1219, 95, '_line_total', '9000'),
(1222, 95, '_bundled_items', 'a:3:{i:0;s:32:"afb67647b35d1240f34c0c881d63a341";i:1;s:32:"2b0b6109837e036631f8dc1c83c93eff";i:2;s:32:"af66c191dfd6ff276a4d18855fd7f34b";}'),
(1223, 95, '_bundle_group_mode', 'parent');

-- Bundled product: Nojka
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) 
VALUES 
(1226, 96, '_product_id', '64'),
(1228, 96, '_qty', '4'),
(1235, 96, '_bundled_by', '2d3cad3ee00f9d391db55a69f74b0ebe'),
(1236, 96, '_bundled_item_id', '1'),
(1280, 96, '_reduced_stock', '4');

-- Bundled product: Plus
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) 
VALUES 
(1241, 97, '_product_id', '65'),
(1243, 97, '_qty', '4'),
(1250, 97, '_bundled_by', '2d3cad3ee00f9d391db55a69f74b0ebe'),
(1251, 97, '_bundled_item_id', '2'),
(1281, 97, '_reduced_stock', '4');

-- Bundled product: Taxta
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) 
VALUES 
(1256, 98, '_product_id', '15'),
(1258, 98, '_qty', '4'),
(1265, 98, '_bundled_by', '2d3cad3ee00f9d391db55a69f74b0ebe'),
(1266, 98, '_bundled_item_id', '3'),
(1282, 98, '_reduced_stock', '4');

-- Additional single product: Nojka
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) 
VALUES 
(1271, 99, '_product_id', '64'),
(1273, 99, '_qty', '1'),
(1275, 99, '_line_subtotal', '1900'),
(1277, 99, '_line_total', '1900'),
(1283, 99, '_reduced_stock', '1');

-- 6. Update product stock levels
UPDATE `wp_postmeta` 
SET `meta_value` = '50' 
WHERE `post_id` = 15 AND `meta_key` = '_stock';

UPDATE `wp_postmeta` 
SET `meta_value` = '50' 
WHERE `post_id` = 64 AND `meta_key` = '_stock';

UPDATE `wp_postmeta` 
SET `meta_value` = '53' 
WHERE `post_id` = 65 AND `meta_key` = '_stock';

-- 7. Update product sales data
UPDATE `wp_postmeta` 
SET `meta_value` = '53' 
WHERE `post_id` = 15 AND `meta_key` = 'total_sales';

UPDATE `wp_postmeta` 
SET `meta_value` = '54' 
WHERE `post_id` = 64 AND `meta_key` = 'total_sales';

UPDATE `wp_postmeta` 
SET `meta_value` = '51' 
WHERE `post_id` = 65 AND `meta_key` = 'total_sales';

-- 8. Update bundle stock info
UPDATE `wp_postmeta` 
SET `meta_value` = '25' 
WHERE `post_id` = 66 AND `meta_key` = '_wc_pb_bundle_stock_quantity';

-- 9. Update product meta lookup tables
UPDATE `wp_wc_product_meta_lookup` 
SET `stock_quantity` = 50, `total_sales` = 53
WHERE `product_id` = 15;

UPDATE `wp_wc_product_meta_lookup` 
SET `stock_quantity` = 50, `total_sales` = 54
WHERE `product_id` = 64;

UPDATE `wp_wc_product_meta_lookup` 
SET `stock_quantity` = 53, `total_sales` = 51
WHERE `product_id` = 65;

UPDATE `wp_wc_product_meta_lookup` 
SET `total_sales` = 25
WHERE `product_id` = 66;

-- 10. Update bundled item max stock values
UPDATE `wp_woocommerce_bundled_itemmeta` 
SET `meta_value` = '50'
WHERE `bundled_item_id` = 1 AND `meta_key` = 'max_stock';

UPDATE `wp_woocommerce_bundled_itemmeta` 
SET `meta_value` = '53'
WHERE `bundled_item_id` = 2 AND `meta_key` = 'max_stock';

UPDATE `wp_woocommerce_bundled_itemmeta` 
SET `meta_value` = '50'
WHERE `bundled_item_id` = 3 AND `meta_key` = 'max_stock';

-- 11. Add order operational data
INSERT INTO `wp_wc_order_operational_data` (`id`,`order_id`,`created_via`,`woocommerce_version`,`prices_include_tax`,`coupon_usages_are_counted`,`download_permission_granted`,`cart_hash`,`new_order_email_sent`,`order_key`,`order_stock_reduced`,`date_paid_gmt`,`date_completed_gmt`,`shipping_tax_amount`,`shipping_total_amount`,`discount_tax_amount`,`discount_total_amount`,`recorded_sales`) 
VALUES (222, 139, 'checkout', '9.7.1', 0, 1, 1, '8d0c74ea60a718ecdfb93065990894cf', 1, 'wc_order_5nl9Hl03AK2re', 1, NULL, NULL, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 1);

-- 12. Add order comments/notes
INSERT INTO `wp_comments` (`comment_ID`,`comment_post_ID`,`comment_author`,`comment_author_email`,`comment_author_url`,`comment_author_IP`,`comment_date`,`comment_date_gmt`,`comment_content`,`comment_karma`,`comment_approved`,`comment_agent`,`comment_type`,`comment_parent`,`user_id`) 
VALUES 
(52, 139, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', '2025-04-02 15:01:10', '2025-04-02 15:01:10', 'Stock hold of 60 minutes applied to: <br>- Nojka (#64) &times; 4<br>- Plus (#65) &times; 4<br>- Taxta (#15) &times; 4<br>- Nojka (#64) &times; 5', 0, '1', 'WooCommerce', 'order_note', 0, 0),
(53, 139, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', '2025-04-02 15:01:11', '2025-04-02 15:01:11', 'Stock levels reduced: Nojka (#64) 55&rarr;51, Plus (#65) 57&rarr;53, Taxta (#15) 54&rarr;50, Nojka (#64) 51&rarr;50', 0, '1', 'WooCommerce', 'order_note', 0, 0),
(54, 139, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', '2025-04-02 15:01:11', '2025-04-02 15:01:11', 'Payment to be made upon delivery. Order status changed from Pending payment to Processing.', 0, '1', 'WooCommerce', 'order_note', 0, 0);

-- 13. Add entries to order stats table
INSERT INTO `wp_wc_order_stats` (`order_id`,`parent_id`,`date_created`,`date_created_gmt`,`date_paid`,`date_completed`,`num_items_sold`,`total_sales`,`tax_total`,`shipping_total`,`net_total`,`returning_customer`,`status`,`customer_id`) 
VALUES (139, 0, '2025-04-02 15:01:09', '2025-04-02 15:01:09', NULL, NULL, 13, 10900, 0, 0, 10900, 0, 'wc-processing', 0);

-- 14. Add entries to order product lookup table
INSERT INTO `wp_wc_order_product_lookup` (`order_item_id`,`order_id`,`product_id`,`variation_id`,`customer_id`,`date_created`,`product_qty`,`product_net_revenue`,`product_gross_revenue`,`coupon_amount`,`tax_amount`,`shipping_amount`,`shipping_tax_amount`) 
VALUES 
(95, 139, 66, 0, 0, '2025-04-02 15:01:09', 2, 9000, 9000, 0, 0, 0, 0),
(96, 139, 64, 0, 0, '2025-04-02 15:01:09', 4, 0, 0, 0, 0, 0, 0),
(97, 139, 65, 0, 0, '2025-04-02 15:01:09', 4, 0, 0, 0, 0, 0, 0),
(98, 139, 15, 0, 0, '2025-04-02 15:01:09', 4, 0, 0, 0, 0, 0, 0),
(99, 139, 64, 0, 0, '2025-04-02 15:01:09', 1, 1900, 1900, 0, 0, 0, 0); 