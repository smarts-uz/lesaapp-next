-- WooCommerce Refund SQL Queries
-- This file contains the essential queries for a refund operation in WooCommerce
-- Organized in proper sequence

-- 1. Create the refund order record
BEGIN;
INSERT INTO `wp_wc_orders` (`id`,`status`,`currency`,`type`,`tax_amount`,`total_amount`,`customer_id`,`billing_email`,`date_created_gmt`,`date_updated_gmt`,`parent_order_id`,`payment_method`,`payment_method_title`,`transaction_id`,`ip_address`,`user_agent`,`customer_note`) 
VALUES (69, 'wc-completed', 'UZS', 'shop_order_refund', 0.00000000, -5700.00000000, NULL, NULL, '2025-04-04 09:33:04', '2025-04-04 09:33:04', 68, NULL, NULL, NULL, NULL, NULL, NULL);
COMMIT;

-- 2. Add refund metadata
BEGIN;
INSERT INTO `wp_wc_orders_meta` (`id`,`order_id`,`meta_key`,`meta_value`) VALUES (24, 69, '_refund_amount', '5700');
INSERT INTO `wp_wc_orders_meta` (`id`,`order_id`,`meta_key`,`meta_value`) VALUES (25, 69, '_refunded_by', '1');
INSERT INTO `wp_wc_orders_meta` (`id`,`order_id`,`meta_key`,`meta_value`) VALUES (26, 69, '_refunded_payment', '');
INSERT INTO `wp_wc_orders_meta` (`id`,`order_id`,`meta_key`,`meta_value`) VALUES (27, 69, '_refund_reason', '');
COMMIT;

-- 3. Create refund order items
BEGIN;
INSERT INTO `wp_woocommerce_order_items` (`order_item_id`,`order_item_name`,`order_item_type`,`order_id`) VALUES (49, 'Lesa', 'line_item', 69);
INSERT INTO `wp_woocommerce_order_items` (`order_item_id`,`order_item_name`,`order_item_type`,`order_id`) VALUES (50, 'Taxta', 'line_item', 69);
INSERT INTO `wp_woocommerce_order_items` (`order_item_id`,`order_item_name`,`order_item_type`,`order_id`) VALUES (51, 'Plus', 'line_item', 69);
INSERT INTO `wp_woocommerce_order_items` (`order_item_id`,`order_item_name`,`order_item_type`,`order_id`) VALUES (52, 'Minus', 'line_item', 69);
COMMIT;

-- 4. Add refund item metadata for 'Lesa' product
BEGIN;
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (576, 49, '_product_id', '66');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (577, 49, '_variation_id', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (578, 49, '_qty', '-3');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (579, 49, '_tax_class', '');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (580, 49, '_line_subtotal', '-5700');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (581, 49, '_line_subtotal_tax', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (582, 49, '_line_total', '-5700');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (583, 49, '_line_tax', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (584, 49, '_line_tax_data', 'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (585, 49, '_refunded_item_id', '41');
COMMIT;

-- 5. Add refund item metadata for 'Taxta' product
BEGIN;
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (586, 50, '_product_id', '63');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (587, 50, '_variation_id', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (588, 50, '_qty', '-3');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (589, 50, '_tax_class', '');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (590, 50, '_line_subtotal', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (591, 50, '_line_subtotal_tax', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (592, 50, '_line_total', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (593, 50, '_line_tax', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (594, 50, '_line_tax_data', 'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (595, 50, '_refunded_item_id', '42');
COMMIT;

-- 6. Add refund item metadata for 'Plus' product
BEGIN;
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (596, 51, '_product_id', '65');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (597, 51, '_variation_id', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (598, 51, '_qty', '-1');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (599, 51, '_tax_class', '');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (600, 51, '_line_subtotal', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (601, 51, '_line_subtotal_tax', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (602, 51, '_line_total', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (603, 51, '_line_tax', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (604, 51, '_line_tax_data', 'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (605, 51, '_refunded_item_id', '43');
COMMIT;

-- 7. Add refund item metadata for 'Minus' product
BEGIN;
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (606, 52, '_product_id', '64');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (607, 52, '_variation_id', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (608, 52, '_qty', '-1');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (609, 52, '_tax_class', '');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (610, 52, '_line_subtotal', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (611, 52, '_line_subtotal_tax', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (612, 52, '_line_total', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (613, 52, '_line_tax', '0');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (614, 52, '_line_tax_data', 'a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (615, 52, '_refunded_item_id', '44');
COMMIT;

-- 8. Update original order items to mark as restocked
BEGIN;
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (616, 43, '_restock_refunded_items', '1');
INSERT INTO `wp_woocommerce_order_itemmeta` (`meta_id`,`order_item_id`,`meta_key`,`meta_value`) VALUES (617, 44, '_restock_refunded_items', '1');
COMMIT;

-- 9. Update product stock quantities
BEGIN;
UPDATE `wp_wc_product_meta_lookup` SET `stock_quantity` = 796 WHERE `product_id` = 65;
UPDATE `wp_wc_product_meta_lookup` SET `stock_quantity` = 995 WHERE `product_id` = 64;
UPDATE `wp_woocommerce_bundled_itemmeta` SET `meta_value` = '796' WHERE `meta_id` = 44;
UPDATE `wp_woocommerce_bundled_itemmeta` SET `meta_value` = '995' WHERE `meta_id` = 66;
COMMIT;

-- 10. Add order notes for stock adjustments
BEGIN;
INSERT INTO `wp_comments` (`comment_ID`,`comment_post_ID`,`comment_author`,`comment_author_email`,`comment_author_url`,`comment_author_IP`,`comment_date`,`comment_date_gmt`,`comment_content`,`comment_karma`,`comment_approved`,`comment_agent`,`comment_type`,`comment_parent`,`user_id`) 
VALUES (6, 68, 'WooCommerce', 'woocommerce@pos.smarts.uz', '', '', '2025-04-04 09:33:04', '2025-04-04 09:33:04', 'Item #65 stock increased from 795 to 796.', 0, '1', 'WooCommerce', 'order_note', 0, 0);

INSERT INTO `wp_comments` (`comment_ID`,`comment_post_ID`,`comment_author`,`comment_author_email`,`comment_author_url`,`comment_author_IP`,`comment_date`,`comment_date_gmt`,`comment_content`,`comment_karma`,`comment_approved`,`comment_agent`,`comment_type`,`comment_parent`,`user_id`) 
VALUES (7, 68, 'WooCommerce', 'woocommerce@pos.smarts.uz', '', '', '2025-04-04 09:33:04', '2025-04-04 09:33:04', 'Item #64 stock increased from 994 to 995.', 0, '1', 'WooCommerce', 'order_note', 0, 0);
COMMIT; 