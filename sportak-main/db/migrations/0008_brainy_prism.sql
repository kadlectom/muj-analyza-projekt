ALTER TABLE `challenges` ADD `slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `challenges_slug_unique` ON `challenges` (`slug`);