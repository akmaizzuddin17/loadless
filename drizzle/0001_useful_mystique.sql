CREATE TABLE `availability` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `availability_user_start` ON `availability` (`user`,`start`);--> statement-breakpoint
CREATE TABLE `planner_state` (
	`user` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
