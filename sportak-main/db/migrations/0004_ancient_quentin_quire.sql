CREATE TABLE `bonus_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`bonus_rule_id` text NOT NULL,
	`user_id` text NOT NULL,
	`challenge_id` text NOT NULL,
	`bonus_points` real NOT NULL,
	`earned_at` integer NOT NULL,
	FOREIGN KEY (`bonus_rule_id`) REFERENCES `bonus_rules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bonus_achievements_bonus_rule_id_user_id_unique` ON `bonus_achievements` (`bonus_rule_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `bonus_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_id` text NOT NULL,
	`name` text NOT NULL,
	`condition_type` text NOT NULL,
	`threshold` real NOT NULL,
	`catalog_item_id` text,
	`window_start` text,
	`window_end` text,
	`days_of_week` text,
	`bonus_points` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`catalog_item_id`) REFERENCES `activity_catalog`(`id`) ON UPDATE no action ON DELETE no action
);
