SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `login` text NULL,
  `password_hash` text NULL,
  `fullname` text NULL,
  `rights` text NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `users` (`id`, `login`, `password_hash`, `fullname`, `rights`) VALUES (1, 'root', 'aea2ae42303906100969a9f04ad5a514', 'Пользователь 1', '{"mh_photobank":2,"mh_photobank_trash":2}');

DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `slug` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `is_active` tinyint NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name`) USING HASH
);

DROP TABLE IF EXISTS `images`;
CREATE TABLE `images`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `path` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `paths` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `type` tinyint NULL DEFAULT 1 COMMENT '1-фото, 2 - иллюстрация',
  `author_id` int NULL DEFAULT NULL,
  `source_id` int NULL DEFAULT NULL,
  `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `user_id` int NULL DEFAULT NULL COMMENT 'айдишник юзера, впервые сохранившего картинку',
  `del_after` int NULL DEFAULT NULL,
  `deleted_at` int NULL DEFAULT NULL,
  `updated_at` int NULL DEFAULT NULL,
  `created_at` int NULL DEFAULT NULL,
  `is_pb` tinyint NULL DEFAULT NULL,
  `width` int NOT NULL DEFAULT 0,
  `height` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `userid_images`(`user_id`) USING BTREE,
  INDEX `authorid_images`(`author_id`) USING BTREE,
  INDEX `sourceid_images`(`source_id`) USING BTREE,
  INDEX `ispb`(`id`, `is_pb`) USING BTREE,
  INDEX `createdpb`(`created_at`, `is_pb`) USING BTREE,
  CONSTRAINT `authorid_images` FOREIGN KEY (`author_id`) REFERENCES `images_authors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sourceid_images` FOREIGN KEY (`source_id`) REFERENCES `images_sources` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userid_images` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `images_sources`;
CREATE TABLE `images_sources`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
);

DROP TABLE IF EXISTS `images_authors`;
CREATE TABLE `images_authors`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
);

DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs`  (
  `date` int NOT NULL DEFAULT unix_timestamp(NOW()),
  `user_id` int NOT NULL DEFAULT 0,
  `route` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `ip_address` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `action_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  INDEX `userid_delete`(`user_id`) USING BTREE,
  CONSTRAINT `userid_delete` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `used_images`;
CREATE TABLE IF NOT EXISTS `used_images`  ( 
      `image_id` INT(11) NOT NULL, 
      `user_id` INT(11) NOT NULL, 
      `timestamp` int NOT NULL, 
      `user_str` text, 
      CONSTRAINT `usedimages_pk` PRIMARY KEY (`image_id`, `user_id`, `timestamp`), 
      CONSTRAINT `usedimages_imageid` FOREIGN KEY ( `image_id` ) REFERENCES `images` ( `id` ) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT `usedimages_userid` FOREIGN KEY ( `user_id` ) REFERENCES `users` ( `id` ) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP VIEW IF EXISTS `image_users_list`;
CREATE VIEW `image_users_list` AS select `users`.`fullname` AS `name`,`users`.`id` AS `id`,count(`images`.`id`) AS `cnt_images`,sum(if(`images`.`deleted_at` is null,1,0)) AS `cnt_active`,sum(if(`images`.`deleted_at` is null,0,1)) AS `cnt_deleted` from (`users` join `images` on(`images`.`user_id` = `users`.`id` and `images`.`is_pb` = 1)) group by `users`.`id`;

DROP TABLE IF EXISTS `watermarks`;
CREATE TABLE `watermarks`  (
   `id` int NOT NULL AUTO_INCREMENT,
   `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
   `type` tinyint NULL DEFAULT NULL COMMENT '1 - лого, 2 - заливка',
   `path` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
   PRIMARY KEY (`id`) USING BTREE
);

SET FOREIGN_KEY_CHECKS = 1;