PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notification_log` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`ref_id` text NOT NULL,
	`user_id` text,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_notification_log`("id", "type", "ref_id", "user_id", "sent_at") SELECT "id", "type", "ref_id", "user_id", "sent_at" FROM `notification_log`;--> statement-breakpoint
DROP TABLE `notification_log`;--> statement-breakpoint
ALTER TABLE `__new_notification_log` RENAME TO `notification_log`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `notification_log_type_ref_id_user_id_unique` ON `notification_log` (`type`,`ref_id`,`user_id`);