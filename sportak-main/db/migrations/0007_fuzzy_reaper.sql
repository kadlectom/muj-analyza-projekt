ALTER TABLE `audit_log` ADD `challenge_id` text REFERENCES challenges(id);--> statement-breakpoint
ALTER TABLE `audit_log` ADD `target_user_id` text REFERENCES users(id);