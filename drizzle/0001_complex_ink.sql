CREATE TABLE `blocked_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wallet_address` text NOT NULL,
	`reason` text NOT NULL,
	`blocked_by` text NOT NULL,
	`blocked_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blocked_users_wallet_address_unique` ON `blocked_users` (`wallet_address`);