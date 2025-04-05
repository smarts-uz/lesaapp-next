-- Start transaction to ensure data consistency
START TRANSACTION;

-- 1. Update original order status to refunded
UPDATE `wp_wc_orders` 
SET `status` = 'wc-refunded',
    `date_updated_gmt` = '2025-04-04 05:06:34'
WHERE `id` = 139;

-- 2. Create refund order record
INSERT INTO `wp_wc_orders` (
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
) VALUES (
    140,
    'wc-completed',
    'UZS',
    'shop_order_refund',
    0.00000000,
    -6400.00000000,
    NULL,
    NULL,
    '2025-04-04 05:06:33',
    '2025-04-04 05:06:33',
    139,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
);

-- 3. Store refund metadata
INSERT INTO `wp_wc_orders_meta` (`id`, `order_id`, `meta_key`, `meta_value`) 
VALUES 
    (401, 140, '_refund_amount', '6400'),
    (402, 140, '_refunded_by', '1'),
    (403, 140, '_refunded_payment', ''),
    (404, 140, '_refund_reason', '');

-- 4. Insert refund line items
INSERT INTO `wp_woocommerce_order_items` (`order_item_id`, `order_item_name`, `order_item_type`, `order_id`) 
VALUES 
    (100, 'Lesa Komplekt', 'line_item', 140),
    (101, 'Nojka', 'line_item', 140),
    (102, 'Plus', 'line_item', 140),
    (103, 'Taxta', 'line_item', 140),
    (104, 'Nojka', 'line_item', 140);

-- 5. Insert refund line item metadata
INSERT INTO `wp_woocommerce_order_itemmeta` 
    (`meta_id`, `order_item_id`, `meta_key`, `meta_value`)
VALUES
    -- Item 100 (Lesa Komplekt - Bundle)
    (1284, 100, '_product_id', '66'),
    (1285, 100, '_variation_id', '0'),
    (1286, 100, '_qty', '-1'),
    (1287, 100, '_tax_class', ''),
    (1288, 100, '_line_subtotal', '-4500'),
    (1289, 100, '_line_subtotal_tax', '0'),
    (1290, 100, '_line_total', '-4500'),
    (1291, 100, '_line_tax', '0'),
    (1292, 100, '_line_tax_data', 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}'),
    (1293, 100, '_refunded_item_id', '95'),
    (1294, 100, '_bundled_items', 'a:4:{i:0;i:101;i:1;i:102;i:2;i:103;i:3;i:104}'),
    
    -- Item 101 (Nojka - Bundle Item)
    (1295, 101, '_product_id', '64'),
    (1296, 101, '_variation_id', '0'),
    (1297, 101, '_qty', '-2'),
    (1298, 101, '_tax_class', ''),
    (1299, 101, '_line_subtotal', '0'),
    (1300, 101, '_line_subtotal_tax', '0'),
    (1301, 101, '_line_total', '0'),
    (1302, 101, '_line_tax', '0'),
    (1303, 101, '_line_tax_data', 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}'),
    (1304, 101, '_refunded_item_id', '96'),
    (1305, 101, '_bundled_by', '100'),
    
    -- Item 102 (Plus - Bundle Item)
    (1306, 102, '_product_id', '65'),
    (1307, 102, '_variation_id', '0'),
    (1308, 102, '_qty', '-2'),
    (1309, 102, '_tax_class', ''),
    (1310, 102, '_line_subtotal', '0'),
    (1311, 102, '_line_subtotal_tax', '0'),
    (1312, 102, '_line_total', '0'),
    (1313, 102, '_line_tax', '0'),
    (1314, 102, '_line_tax_data', 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}'),
    (1315, 102, '_refunded_item_id', '97'),
    (1316, 102, '_bundled_by', '100'),
    
    -- Item 103 (Taxta - Bundle Item)
    (1317, 103, '_product_id', '15'),
    (1318, 103, '_variation_id', '0'),
    (1319, 103, '_qty', '-2'),
    (1320, 103, '_tax_class', ''),
    (1321, 103, '_line_subtotal', '0'),
    (1322, 103, '_line_subtotal_tax', '0'),
    (1323, 103, '_line_total', '0'),
    (1324, 103, '_line_tax', '0'),
    (1325, 103, '_line_tax_data', 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}'),
    (1326, 103, '_refunded_item_id', '98'),
    (1327, 103, '_bundled_by', '100'),
    
    -- Item 104 (Nojka - Simple Product)
    (1328, 104, '_product_id', '64'),
    (1329, 104, '_variation_id', '0'),
    (1330, 104, '_qty', '-1'),
    (1331, 104, '_tax_class', ''),
    (1332, 104, '_line_subtotal', '-1900'),
    (1333, 104, '_line_subtotal_tax', '0'),
    (1334, 104, '_line_total', '-1900'),
    (1335, 104, '_line_tax', '0'),
    (1336, 104, '_line_tax_data', 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}'),
    (1337, 104, '_refunded_item_id', '99');

-- 6. Update product stock levels
UPDATE `wp_postmeta` 
SET `meta_value` = CAST(CAST(meta_value AS SIGNED) + 1 AS CHAR)
WHERE `post_id` IN (15, 64, 65) 
AND `meta_key` = '_stock';

-- 7. Update product meta lookup
UPDATE `wp_wc_product_meta_lookup` 
SET `stock_quantity` = `stock_quantity` + 1,
    `stock_status` = 'instock'
WHERE `product_id` IN (15, 64, 65);

-- 8. Add refund notes
INSERT INTO `wp_comments` 
    (`comment_ID`, `comment_post_ID`, `comment_author`, `comment_author_email`, 
     `comment_author_url`, `comment_author_IP`, `comment_date`, `comment_date_gmt`,
     `comment_content`, `comment_karma`, `comment_approved`, `comment_agent`, 
     `comment_type`, `comment_parent`, `user_id`)
VALUES
    (55, 139, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '', 
     '2025-04-04 05:06:33', '2025-04-04 05:06:33',
     'Refunded bundle "Lesa Komplekt" (-4500 UZS) with items: Nojka (x2), Plus (x2), Taxta (x2), and separate Nojka (-1900 UZS)', 
     0, '1', 'WooCommerce', 'order_note', 0, 0),
    
    (56, 139, 'WooCommerce', 'woocommerce@lesa.smarts.uz', '', '',
     '2025-04-04 05:06:33', '2025-04-04 05:06:33',
     'Order status changed from Processing to Refunded.',
     0, '1', 'WooCommerce', 'order_note', 0, 0);

-- Update bundled item metadata
UPDATE `wp_woocommerce_bundled_itemmeta`
SET `meta_value` = CAST(CAST(meta_value AS SIGNED) + 1 AS CHAR)
WHERE `meta_key` = 'max_stock'
AND `bundled_item_id` IN (1, 2, 3);

-- Reset reduced stock flags
UPDATE `wp_woocommerce_order_itemmeta`
SET `meta_value` = '0'
WHERE `meta_key` = '_reduced_stock'
AND `order_item_id` IN (95, 96, 97, 98, 99);
