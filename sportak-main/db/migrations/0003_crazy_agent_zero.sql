CREATE TABLE `activity_partners` (
	`activity_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`activity_id`, `user_id`),
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `challenges` ADD `partner_bonus` real DEFAULT 0 NOT NULL;