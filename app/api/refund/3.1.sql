-- WooCommerce Refund Order Queries - Fixed Version
-- This file contains the necessary SQL queries for properly processing a refund in WooCommerce

-- Set up transaction for comments
BEGIN;
LOCK TABLES `wp_comments` WRITE;

-- Add comments/notes about refund process
INSERT INTO `wp_comments` (`comment_post_ID`, `comment_author`, `comment_author_email`, `comment_author_url`, `comment_author_IP`, `comment_date`, `comment_date_gmt`, `comment_content`, `comment_karma`, `comment_approved`, `comment_agent`, `comment_type`, `comment_parent`, `user_id`) 
VALUES (141, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', '2025-04-04 05:43:49', '2025-04-04 05:43:49', 'Item #64 stock increased from 51 to 53.', 0, '1', 'WooCommerce', 'order_note', 0, 0);

INSERT INTO `wp_comments` (`comment_post_ID`, `comment_author`, `comment_author_email`, `comment_author_url`, `comment_author_IP`, `comment_date`, `comment_date_gmt`, `comment_content`, `comment_karma`, `comment_approved`, `comment_agent`, `comment_type`, `comment_parent`, `user_id`) 
VALUES (141, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', '2025-04-04 05:43:49', '2025-04-04 05:43:49', 'Item #65 stock increased from 52 to 54.', 0, '1', 'WooCommerce', 'order_note', 0, 0);

INSERT INTO `wp_comments` (`comment_post_ID`, `comment_author`, `comment_author_email`, `comment_author_url`, `comment_author_IP`, `comment_date`, `comment_date_gmt`, `comment_content`, `comment_karma`, `comment_approved`, `comment_agent`, `comment_type`, `comment_parent`, `user_id`) 
VALUES (141, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', '2025-04-04 05:43:49', '2025-04-04 05:43:49', 'Item #15 stock increased from 50 to 52.', 0, '1', 'WooCommerce', 'order_note', 0, 0);

INSERT INTO `wp_comments` (`comment_post_ID`, `comment_author`, `comment_author_email`, `comment_author_url`, `comment_author_IP`, `comment_date`, `comment_date_gmt`, `comment_content`, `comment_karma`, `comment_approved`, `comment_agent`, `comment_type`, `comment_parent`, `user_id`) 
VALUES (141, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', '2025-04-04 05:43:50', '2025-04-04 05:43:50', 'Order status changed from Processing to Refunded.', 0, '1', 'WooCommerce', 'order_note', 0, 0);

UNLOCK TABLES;
COMMIT;

-- Update the main order status
BEGIN;
LOCK TABLES `wp_wc_orders` WRITE;

-- Change the order status to refunded
UPDATE `wp_wc_orders` 
SET `status` = 'wc-refunded', 
    `date_updated_gmt` = '2025-04-04 05:43:51' 
WHERE `id` = 141;

-- Create a refund record with correct refund type and status
INSERT INTO `wp_wc_orders` (`id`, `status`, `currency`, `type`, `tax_amount`, `total_amount`, `customer_id`, `billing_email`, `date_created_gmt`, `date_updated_gmt`, `parent_order_id`, `payment_method`, `payment_method_title`, `transaction_id`, `ip_address`, `user_agent`, `customer_note`) 
VALUES (142, 'wc-completed', 'UZS', 'shop_order_refund', 0.00000000, -4500.00000000, NULL, NULL, '2025-04-04 05:43:49', '2025-04-04 05:43:49', 141, NULL, NULL, NULL, NULL, NULL, NULL);

UNLOCK TABLES;
COMMIT;

-- Update refund metadata
BEGIN;
LOCK TABLES `wp_wc_orders_meta` WRITE;

INSERT INTO `wp_wc_orders_meta` (`order_id`, `meta_key`, `meta_value`) 
VALUES (142, '_refund_amount', '4500');

INSERT INTO `wp_wc_orders_meta` (`order_id`, `meta_key`, `meta_value`) 
VALUES (142, '_refunded_by', '1');

INSERT INTO `wp_wc_orders_meta` (`order_id`, `meta_key`, `meta_value`) 
VALUES (142, '_refunded_payment', '');

INSERT INTO `wp_wc_orders_meta` (`order_id`, `meta_key`, `meta_value`) 
VALUES (142, '_refund_reason', '');

UNLOCK TABLES;
COMMIT;

-- Update order statistics
BEGIN;
LOCK TABLES `wp_wc_order_stats` WRITE;

-- Update the original order stats to reflect refund status
UPDATE `wp_wc_order_stats` 
SET `status` = 'wc-refunded' 
WHERE `order_id` = 141;

-- Create negative stats entry for the refund with correct item count (-7)
INSERT INTO `wp_wc_order_stats` (`order_id`, `parent_id`, `date_created`, `date_created_gmt`, `date_paid`, `date_completed`, `num_items_sold`, `total_sales`, `tax_total`, `shipping_total`, `net_total`, `returning_customer`, `status`, `customer_id`) 
VALUES (142, 141, '2025-04-04 05:43:49', '2025-04-04 05:43:49', NULL, NULL, -7, -4500, 0, 0, -4500, NULL, 'wc-completed', 1);

UNLOCK TABLES;
COMMIT;

-- Update order items for the refund
BEGIN;
LOCK TABLES `wp_woocommerce_order_items` WRITE;

-- Add refund line items
INSERT INTO `wp_woocommerce_order_items` (`order_item_id`, `order_item_name`, `order_item_type`, `order_id`) 
VALUES (104, 'Lesa Komplekt', 'line_item', 142);

INSERT INTO `wp_woocommerce_order_items` (`order_item_id`, `order_item_name`, `order_item_type`, `order_id`) 
VALUES (105, 'Nojka', 'line_item', 142);

INSERT INTO `wp_woocommerce_order_items` (`order_item_id`, `order_item_name`, `order_item_type`, `order_id`) 
VALUES (106, 'Plus', 'line_item', 142);

INSERT INTO `wp_woocommerce_order_items` (`order_item_id`, `order_item_name`, `order_item_type`, `order_id`) 
VALUES (107, 'Taxta', 'line_item', 142);

UNLOCK TABLES;
COMMIT;

-- Update order item metadata
BEGIN;
LOCK TABLES `wp_woocommerce_order_itemmeta` WRITE;

-- Link refunded items to original items
INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (104, '_refunded_item_id', '100');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (105, '_refunded_item_id', '101');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (106, '_refunded_item_id', '102');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (107, '_refunded_item_id', '103');

-- Add refund item prices (matching the UI)
INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (104, '_line_total', '-4500');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (105, '_line_total', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (106, '_line_total', '0');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (107, '_line_total', '0');

-- Add refund item quantities
INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (104, '_qty', '-1');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (105, '_qty', '-2');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (106, '_qty', '-2');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (107, '_qty', '-2');

-- Record the product IDs
INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (104, '_product_id', '66');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (105, '_product_id', '64');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (106, '_product_id', '65');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (107, '_product_id', '15');

-- Record the restock refunded items flag for original items
INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (101, '_restock_refunded_items', '2');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (102, '_restock_refunded_items', '2');

INSERT INTO `wp_woocommerce_order_itemmeta` (`order_item_id`, `meta_key`, `meta_value`) 
VALUES (103, '_restock_refunded_items', '2');

UNLOCK TABLES;
COMMIT;

-- Update product stock levels
BEGIN;
LOCK TABLES `wp_postmeta` WRITE;

-- Increase stock levels back to pre-purchase amounts
UPDATE `wp_postmeta` 
SET `meta_value` = '53' 
WHERE `post_id` = 64 AND `meta_key` = '_stock';

UPDATE `wp_postmeta` 
SET `meta_value` = '54' 
WHERE `post_id` = 65 AND `meta_key` = '_stock';

UPDATE `wp_postmeta` 
SET `meta_value` = '52' 
WHERE `post_id` = 15 AND `meta_key` = '_stock';

-- Update bundle stock quantity
UPDATE `wp_postmeta` 
SET `meta_value` = '26' 
WHERE `post_id` = 66 AND `meta_key` = '_wc_pb_bundle_stock_quantity';

UNLOCK TABLES;
COMMIT;

-- Update bundled item stock max values
BEGIN;
LOCK TABLES `wp_woocommerce_bundled_itemmeta` WRITE;

UPDATE `wp_woocommerce_bundled_itemmeta` 
SET `meta_value` = '52' 
WHERE `bundled_item_id` = 1 AND `meta_key` = 'max_stock';

UPDATE `wp_woocommerce_bundled_itemmeta` 
SET `meta_value` = '54' 
WHERE `bundled_item_id` = 2 AND `meta_key` = 'max_stock';

UPDATE `wp_woocommerce_bundled_itemmeta` 
SET `meta_value` = '52' 
WHERE `bundled_item_id` = 3 AND `meta_key` = 'max_stock';

UNLOCK TABLES;
COMMIT;

-- Update the operational data for the order
BEGIN;
LOCK TABLES `wp_wc_order_operational_data` WRITE;

-- Create entry for the refund
INSERT INTO `wp_wc_order_operational_data` (`order_id`, `created_via`, `woocommerce_version`, `prices_include_tax`, `coupon_usages_are_counted`, `download_permission_granted`, `cart_hash`, `new_order_email_sent`, `order_key`, `order_stock_reduced`, `date_paid_gmt`, `date_completed_gmt`, `shipping_tax_amount`, `shipping_total_amount`, `discount_tax_amount`, `discount_total_amount`, `recorded_sales`) 
VALUES (142, NULL, '9.7.1', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 0);

UNLOCK TABLES;
COMMIT;

-- Update product lookup data
BEGIN;
LOCK TABLES `wp_wc_order_product_lookup` WRITE;

-- Add negative entries for refunded products with corrected revenue values
INSERT INTO `wp_wc_order_product_lookup` (`order_item_id`, `order_id`, `product_id`, `variation_id`, `customer_id`, `date_created`, `product_qty`, `product_net_revenue`, `product_gross_revenue`, `coupon_amount`, `tax_amount`, `shipping_amount`, `shipping_tax_amount`) 
VALUES (104, 142, 66, 0, 1, '2025-04-04 05:43:49', -1, -4500.0000, -4500.0000, 0.0000, 0.0000, 0.0000, 0.0000);

INSERT INTO `wp_wc_order_product_lookup` (`order_item_id`, `order_id`, `product_id`, `variation_id`, `customer_id`, `date_created`, `product_qty`, `product_net_revenue`, `product_gross_revenue`, `coupon_amount`, `tax_amount`, `shipping_amount`, `shipping_tax_amount`) 
VALUES (105, 142, 64, 0, 1, '2025-04-04 05:43:49', -2, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000);

INSERT INTO `wp_wc_order_product_lookup` (`order_item_id`, `order_id`, `product_id`, `variation_id`, `customer_id`, `date_created`, `product_qty`, `product_net_revenue`, `product_gross_revenue`, `coupon_amount`, `tax_amount`, `shipping_amount`, `shipping_tax_amount`) 
VALUES (106, 142, 65, 0, 1, '2025-04-04 05:43:49', -2, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000);

INSERT INTO `wp_wc_order_product_lookup` (`order_item_id`, `order_id`, `product_id`, `variation_id`, `customer_id`, `date_created`, `product_qty`, `product_net_revenue`, `product_gross_revenue`, `coupon_amount`, `tax_amount`, `shipping_amount`, `shipping_tax_amount`) 
VALUES (107, 142, 15, 0, 1, '2025-04-04 05:43:49', -2, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000);

UNLOCK TABLES;
COMMIT;

-- Update various cache and transients in wp_options
BEGIN;
LOCK TABLES `wp_options` WRITE;

UPDATE `wp_options` 
SET `option_value` = '1743745432' 
WHERE `option_name` = '_transient_woocommerce_bundles_stock_reports-transient-version';

UPDATE `wp_options` 
SET `option_value` = '1743745432' 
WHERE `option_name` = '_transient_woocommerce_bundles_revenue_reports-transient-version';

UPDATE `wp_options`
SET `option_value` = '1743745431'
WHERE `option_name` = '_transient_orders-transient-version';

UPDATE `wp_options` 
SET `option_value` = '1743745429' 
WHERE `option_name` = '_transient_product_query-transient-version';

UPDATE `wp_options` 
SET `option_value` = '1743745429' 
WHERE `option_name` = '_transient_product-transient-version';

UPDATE `wp_options` 
SET `option_value` = '1743745443' 
WHERE `option_name` = '_transient_woocommerce_reports-transient-version';

UNLOCK TABLES;
COMMIT; 