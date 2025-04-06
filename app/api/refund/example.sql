-- WooCommerce Refund Order Queries
-- This file contains the necessary queries to process a refund in WooCommerce

-- 1. BEGIN TRANSACTION
BEGIN;

-- 2. Create refund record in wp_wc_orders
INSERT INTO `wp_wc_orders` 
(`id`, `status`, `currency`, `type`, `tax_amount`, `total_amount`, `customer_id`, `billing_email`, 
`date_created_gmt`, `date_updated_gmt`, `parent_order_id`, `payment_method`, `payment_method_title`, 
`transaction_id`, `ip_address`, `user_agent`, `customer_note`) 
VALUES 
(142, 'wc-completed', 'UZS', 'shop_order_refund', 0.00000000, -4500.00000000, NULL, NULL, 
'2025-04-04 09:21:39', '2025-04-04 09:21:40', 141, NULL, NULL, NULL, NULL, NULL, NULL);

-- 3. Add refund metadata
INSERT INTO `wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`) 
VALUES (365, 142, '_refund_amount', '4500');

INSERT INTO `wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`) 
VALUES (366, 142, '_refunded_by', '1');

INSERT INTO `wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`) 
VALUES (367, 142, '_refunded_payment', '');

INSERT INTO `wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`) 
VALUES (368, 142, '_refund_reason', '');

-- 4. Add operational data for the refund
INSERT INTO `wp_wc_order_operational_data` 
(`id`, `order_id`, `created_via`, `woocommerce_version`, `prices_include_tax`, 
`coupon_usages_are_counted`, `download_permission_granted`, `cart_hash`, 
`new_order_email_sent`, `order_key`, `order_stock_reduced`, `date_paid_gmt`, 
`date_completed_gmt`, `shipping_tax_amount`, `shipping_total_amount`, 
`discount_tax_amount`, `discount_total_amount`, `recorded_sales`) 
VALUES 
(230, 142, NULL, '9.7.1', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
0.00000000, 0.00000000, 0.00000000, 0.00000000, NULL);

-- 5. Add refund line items
INSERT INTO `wp_woocommerce_order_items` 
(`order_item_id`, `order_item_name`, `order_item_type`, `order_id`) 
VALUES (104, 'Lesa Komplekt', 'line_item', 142);

INSERT INTO `wp_woocommerce_order_items` 
(`order_item_id`, `order_item_name`, `order_item_type`, `order_id`) 
VALUES (105, 'Nojka', 'line_item', 142);

INSERT INTO `wp_woocommerce_order_items` 
(`order_item_id`, `order_item_name`, `order_item_type`, `order_id`) 
VALUES (106, 'Plus', 'line_item', 142);

INSERT INTO `wp_woocommerce_order_items` 
(`order_item_id`, `order_item_name`, `order_item_type`, `order_id`) 
VALUES (107, 'Taxta', 'line_item', 142);

-- 6. Add refund line item metadata
-- For the Lesa Komplekt product
INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1345, 104, '_product_id', '66');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1346, 104, '_variation_id', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1347, 104, '_qty', '-1');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1348, 104, '_tax_class', '');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1349, 104, '_line_subtotal', '-4500');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1350, 104, '_line_subtotal_tax', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1351, 104, '_line_total', '-4500');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1352, 104, '_line_tax', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1353, 104, '_line_tax_data', 'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1354, 104, '_refunded_item_id', '100');

-- For the Nojka product
INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1355, 105, '_product_id', '64');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1356, 105, '_variation_id', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1357, 105, '_qty', '-1');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1358, 105, '_tax_class', '');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1359, 105, '_line_subtotal', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1360, 105, '_line_subtotal_tax', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1361, 105, '_line_total', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1362, 105, '_line_tax', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1363, 105, '_line_tax_data', 'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1364, 105, '_refunded_item_id', '101');

-- For the Plus product
INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1365, 106, '_product_id', '65');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1366, 106, '_variation_id', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1367, 106, '_qty', '-1');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1368, 106, '_tax_class', '');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1369, 106, '_line_subtotal', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1370, 106, '_line_subtotal_tax', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1371, 106, '_line_total', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1372, 106, '_line_tax', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1373, 106, '_line_tax_data', 'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1374, 106, '_refunded_item_id', '102');

-- For the Taxta product
INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1375, 107, '_product_id', '15');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1376, 107, '_variation_id', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1377, 107, '_qty', '-1');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1378, 107, '_tax_class', '');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1379, 107, '_line_subtotal', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1380, 107, '_line_subtotal_tax', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1381, 107, '_line_total', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1382, 107, '_line_tax', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1383, 107, '_line_tax_data', 'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1384, 107, '_refunded_item_id', '103');

-- 7. Add restock flags to the original order items
INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1385, 101, '_restock_refunded_items', '1');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1386, 102, '_restock_refunded_items', '1');

INSERT INTO `wp_woocommerce_order_itemmeta` 
(`meta_id`, `order_item_id`, `meta_key`, `meta_value`) 
VALUES (1387, 103, '_restock_refunded_items', '1');

-- 8. Update product stock data
-- Update stock in wp_postmeta
UPDATE `wp_postmeta` SET `meta_value` = '51' 
WHERE `post_id` = 15 AND `meta_key` = '_stock';

UPDATE `wp_postmeta` SET `meta_value` = '52' 
WHERE `post_id` = 64 AND `meta_key` = '_stock';

UPDATE `wp_postmeta` SET `meta_value` = '53' 
WHERE `post_id` = 65 AND `meta_key` = '_stock';

-- Update stock lookup tables
UPDATE `wp_wc_product_meta_lookup` 
SET `stock_quantity` = '51' 
WHERE `product_id` = 15;

UPDATE `wp_wc_product_meta_lookup` 
SET `stock_quantity` = '52' 
WHERE `product_id` = 64;

UPDATE `wp_wc_product_meta_lookup` 
SET `stock_quantity` = '53' 
WHERE `product_id` = 65;

-- 9. Update bundle stock data
UPDATE `wp_woocommerce_bundled_itemmeta` 
SET `meta_value` = '51' 
WHERE `bundled_item_id` = 3 AND `meta_key` = 'max_stock';

UPDATE `wp_woocommerce_bundled_itemmeta` 
SET `meta_value` = '52' 
WHERE `bundled_item_id` = 1 AND `meta_key` = 'max_stock';

UPDATE `wp_woocommerce_bundled_itemmeta` 
SET `meta_value` = '53' 
WHERE `bundled_item_id` = 2 AND `meta_key` = 'max_stock';

-- 10. Add action scheduler entries for processing the refund
INSERT INTO `wp_actionscheduler_actions` 
(`action_id`, `hook`, `status`, `scheduled_date_gmt`, `scheduled_date_local`, 
`priority`, `args`, `schedule`, `group_id`, `attempts`, `last_attempt_gmt`, 
`last_attempt_local`, `claim_id`, `extended_args`) 
VALUES 
(75, 'wc-admin_import_orders', 'pending', '2025-04-04 09:21:45', '2025-04-04 09:21:45', 
10, '[141]', 'O:30:\"ActionScheduler_SimpleSchedule\":2:{s:22:\"\0*\0scheduled_timestamp\";i:1743758505;s:41:\"\0ActionScheduler_SimpleSchedule\0timestamp\";i:1743758505;}', 
4, 0, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 0, NULL);

INSERT INTO `wp_actionscheduler_actions` 
(`action_id`, `hook`, `status`, `scheduled_date_gmt`, `scheduled_date_local`, 
`priority`, `args`, `schedule`, `group_id`, `attempts`, `last_attempt_gmt`, 
`last_attempt_local`, `claim_id`, `extended_args`) 
VALUES 
(76, 'wc-admin_import_orders', 'pending', '2025-04-04 09:21:45', '2025-04-04 09:21:45', 
10, '[142]', 'O:30:\"ActionScheduler_SimpleSchedule\":2:{s:22:\"\0*\0scheduled_timestamp\";i:1743758505;s:41:\"\0ActionScheduler_SimpleSchedule\0timestamp\";i:1743758505;}', 
4, 0, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 0, NULL);

-- 11. Log the action creation
INSERT INTO `wp_actionscheduler_logs` 
(`log_id`, `action_id`, `message`, `log_date_gmt`, `log_date_local`) 
VALUES (203, 75, 'action created', '2025-04-04 09:21:40', '2025-04-04 09:21:40');

INSERT INTO `wp_actionscheduler_logs` 
(`log_id`, `action_id`, `message`, `log_date_gmt`, `log_date_local`) 
VALUES (204, 76, 'action created', '2025-04-04 09:21:40', '2025-04-04 09:21:40');

-- 12. Add order notes for stock increases
INSERT INTO `wp_comments` 
(`comment_ID`, `comment_post_ID`, `comment_author`, `comment_author_email`, 
`comment_author_url`, `comment_author_IP`, `comment_date`, `comment_date_gmt`, 
`comment_content`, `comment_karma`, `comment_approved`, `comment_agent`, 
`comment_type`, `comment_parent`, `user_id`) 
VALUES 
(58, 141, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', 
'2025-04-04 09:21:40', '2025-04-04 09:21:40', 
'Item #64 stock increased from 51 to 52.', 0, '1', 'WooCommerce', 'order_note', 0, 0);

INSERT INTO `wp_comments` 
(`comment_ID`, `comment_post_ID`, `comment_author`, `comment_author_email`, 
`comment_author_url`, `comment_author_IP`, `comment_date`, `comment_date_gmt`, 
`comment_content`, `comment_karma`, `comment_approved`, `comment_agent`, 
`comment_type`, `comment_parent`, `user_id`) 
VALUES 
(59, 141, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', 
'2025-04-04 09:21:40', '2025-04-04 09:21:40', 
'Item #65 stock increased from 52 to 53.', 0, '1', 'WooCommerce', 'order_note', 0, 0);

INSERT INTO `wp_comments` 
(`comment_ID`, `comment_post_ID`, `comment_author`, `comment_author_email`, 
`comment_author_url`, `comment_author_IP`, `comment_date`, `comment_date_gmt`, 
`comment_content`, `comment_karma`, `comment_approved`, `comment_agent`, 
`comment_type`, `comment_parent`, `user_id`) 
VALUES 
(60, 141, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', 
'2025-04-04 09:21:40', '2025-04-04 09:21:40', 
'Item #15 stock increased from 50 to 51.', 0, '1', 'WooCommerce', 'order_note', 0, 0);

-- 13. Update parent order to reflect refund
UPDATE `wp_wc_orders` 
SET `date_updated_gmt` = '2025-04-04 09:21:40' 
WHERE `id` = 141;

-- 14. Update related transients
UPDATE `wp_options` 
SET `option_value` = '1743758500' 
WHERE `option_name` = '_transient_product_query-transient-version';

UPDATE `wp_options` 
SET `option_value` = '1743758500' 
WHERE `option_name` = '_transient_product-transient-version';

UPDATE `wp_options` 
SET `option_value` = '1743758502' 
WHERE `option_name` = '_transient_woocommerce_bundles_stock_reports-transient-version';

UPDATE `wp_options` 
SET `option_value` = '1743758502' 
WHERE `option_name` = '_transient_woocommerce_bundles_revenue_reports-transient-version';

UPDATE `wp_options` 
SET `option_value` = '1743758500' 
WHERE `option_name` = '_transient_orders-transient-version';

-- 15. COMMIT TRANSACTION
COMMIT; 