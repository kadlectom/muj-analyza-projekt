-- Remove the stale FK on catalog_item_ids (carried over from the RENAME COLUMN in 0005).
-- SQLite can't DROP CONSTRAINT, so we recreate the table without it.
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_bonus_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_id` text NOT NULL,
	`name` text NOT NULL,
	`condition_type` text NOT NULL,
	`threshold` real NOT NULL,
	`catalog_item_ids` text,
	`window_start` text,
	`window_end` text,
	`days_of_week` text,
	`bonus_points` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_bonus_rules`
SELECT `id`, `challenge_id`, `name`, `condition_type`, `threshold`, `catalog_item_ids`, `window_start`, `window_end`, `days_of_week`, `bonus_points`, `created_at`
FROM `bonus_rules`;
--> statement-breakpoint
DROP TABLE `bonus_rules`;
--> statement-breakpoint
ALTER TABLE `__new_bonus_rules` RENAME TO `bonus_rules`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
