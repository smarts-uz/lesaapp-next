-- WooCommerce Customer Creation SQL Script
-- This script contains the necessary queries to create a new customer in WooCommerce

-- Begin transaction
BEGIN;

-- 1. First, add the user to wp_users table and get the ID
-- In MySQL you can use LAST_INSERT_ID() to get the ID of the last inserted row
INSERT INTO `wp_users` (`user_login`, `user_pass`, `user_nicename`, `user_email`, `user_url`, `user_registered`, `user_activation_key`, `user_status`, `display_name`) 
VALUES ('customer_username', '$P$BbnHEK2RSxkw4..FOcYKwK2aDtgq1q0', 'customer-nicename', 'customer@example.com', '', NOW(), '', 0, 'Customer Name');

-- Store the last inserted ID
SET @user_id = LAST_INSERT_ID();

-- 3. Add user metadata - basic info
INSERT INTO `wp_usermeta` (`user_id`, `meta_key`, `meta_value`) 
VALUES 
(@user_id, 'nickname', 'Customer Nickname'),
(@user_id, 'first_name', 'Customer First Name'),
(@user_id, 'last_name', 'Customer Last Name'),
(@user_id, 'description', ''),
(@user_id, 'rich_editing', 'true'),
(@user_id, 'syntax_highlighting', 'true'),
(@user_id, 'comment_shortcuts', 'false'),
(@user_id, 'admin_color', 'fresh'),
(@user_id, 'use_ssl', '0'),
(@user_id, 'show_admin_bar_front', 'true'),
(@user_id, 'locale', '');

-- 4. Set capabilities for the customer role
INSERT INTO `wp_usermeta` (`user_id`, `meta_key`, `meta_value`) 
VALUES (@user_id, 'wp_capabilities', 'a:1:{s:8:"customer";b:1;}');

-- 5. Set user level (default 0 for customers)
INSERT INTO `wp_usermeta` (`user_id`, `meta_key`, `meta_value`) 
VALUES (@user_id, 'wp_user_level', '0');

-- 6. Other WordPress user metadata
INSERT INTO `wp_usermeta` (`user_id`, `meta_key`, `meta_value`) 
VALUES (@user_id, 'dismissed_wp_pointers', '');

-- 7. Add customer to WooCommerce customer lookup table
INSERT INTO `wp_wc_customer_lookup` (`user_id`, `username`, `first_name`, `last_name`, `email`, `date_registered`, `country`, `postcode`, `city`, `state`) 
VALUES (@user_id, 'customer_username', 'Customer First Name', 'Customer Last Name', 'customer@example.com', NOW(), '', '', '', '');

-- 8. Update last update timestamp
INSERT INTO `wp_usermeta` (`user_id`, `meta_key`, `meta_value`) 
VALUES (@user_id, 'last_update', UNIX_TIMESTAMP());

-- 9. Optional: Add billing information
INSERT INTO `wp_usermeta` (`user_id`, `meta_key`, `meta_value`) 
VALUES 
(@user_id, 'billing_first_name', 'Billing First Name'),
(@user_id, 'billing_last_name', 'Billing Last Name'),
(@user_id, 'billing_company', ''),
(@user_id, 'billing_address_1', 'Billing Address Line 1'),
(@user_id, 'billing_address_2', ''),
(@user_id, 'billing_city', 'Billing City'),
(@user_id, 'billing_state', 'State Code'),
(@user_id, 'billing_postcode', 'Postal Code'),
(@user_id, 'billing_country', 'Country Code'),
(@user_id, 'billing_phone', 'Phone Number'),
(@user_id, 'billing_email', 'customer@example.com');

-- 10. Optional: Add shipping information
INSERT INTO `wp_usermeta` (`user_id`, `meta_key`, `meta_value`) 
VALUES 
(@user_id, 'shipping_first_name', 'Shipping First Name'),
(@user_id, 'shipping_last_name', 'Shipping Last Name'),
(@user_id, 'shipping_company', ''),
(@user_id, 'shipping_address_1', 'Shipping Address Line 1'),
(@user_id, 'shipping_address_2', ''),
(@user_id, 'shipping_city', 'Shipping City'),
(@user_id, 'shipping_state', 'State Code'),
(@user_id, 'shipping_postcode', 'Postal Code'),
(@user_id, 'shipping_country', 'Country Code');

-- 11. Update user count in wp_options
UPDATE `wp_options` SET `option_value` = (SELECT COUNT(*) FROM `wp_users`) WHERE `option_name` = 'user_count';

-- 12. Initialize empty shopping cart
INSERT INTO `wp_usermeta` (`user_id`, `meta_key`, `meta_value`) 
VALUES (@user_id, '_woocommerce_persistent_cart_1', 'a:1:{s:4:"cart";a:0:{}}');

-- Commit transaction
COMMIT; 