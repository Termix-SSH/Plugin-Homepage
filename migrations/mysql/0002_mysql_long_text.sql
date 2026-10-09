-- homepage 0002: mysql_long_text
-- TEXT caps at 64KB on MySQL, too small for long notes and big layouts.

ALTER TABLE `p_homepage_homepage_items` MODIFY COLUMN `config` longtext NOT NULL DEFAULT ('{}');
ALTER TABLE `p_homepage_homepage_layouts` MODIFY COLUMN `layout` longtext NOT NULL DEFAULT ('{}');
