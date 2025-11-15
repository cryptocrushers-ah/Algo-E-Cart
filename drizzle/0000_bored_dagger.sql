CREATE TABLE `escrow_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`buyer` text NOT NULL,
	`seller` text NOT NULL,
	`amount` integer NOT NULL,
	`token_id` integer,
	`escrow_address` text NOT NULL,
	`status` text DEFAULT 'INIT' NOT NULL,
	`tx_id` text,
	`product_name` text NOT NULL,
	`product_description` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
