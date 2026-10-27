ALTER TABLE `settings` ADD `whatsapp` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `facebook_url` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `tiktok_url` text;--> statement-breakpoint
-- The phone number becomes the WhatsApp number (the menu now opens a WhatsApp chat instead of calling).
UPDATE `settings` SET `whatsapp` = `phone` WHERE `whatsapp` IS NULL;
