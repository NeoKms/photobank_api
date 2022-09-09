SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `images` VALUES (1, '33fa517dc47eb4d0fa957823b91b9a26.jpg', 'G:\\work c\\work\\nkms\\photobank_api\\upload/images/2022/9/9/1_full.jpeg', '{\"full\":\"upload/images/2022/9/9/1_full.jpeg\",\"full_w\":\"upload/images/2022/9/9/1_full.webp\",\"desktop\":\"upload/images/2022/9/9/1_desktop.jpeg\",\"desktop_w\":\"upload/images/2022/9/9/1_desktop.webp\",\"tablet\":\"upload/images/2022/9/9/1_tablet.jpeg\",\"tablet_w\":\"upload/images/2022/9/9/1_tablet.webp\",\"mobile\":\"upload/images/2022/9/9/1_mobile.jpeg\",\"mobile_w\":\"upload/images/2022/9/9/1_mobile.webp\"}', '', 1, 1, 1, '[1,2,3]', 1, NULL, NULL, NULL, 1662730510, 1, 1000, 667);
INSERT INTO `images` VALUES (2, '45e85f5d8c4daac9b21f40c00b67445d.jpg', 'G:\\work c\\work\\nkms\\photobank_api\\upload/images/2022/9/9/2_full.jpeg', '{\"full\":\"upload/images/2022/9/9/2_full.jpeg\",\"full_w\":\"upload/images/2022/9/9/2_full.webp\",\"tablet\":\"upload/images/2022/9/9/2_tablet.jpeg\",\"tablet_w\":\"upload/images/2022/9/9/2_tablet.webp\",\"desktop_w\":\"upload/images/2022/9/9/2_desktop.webp\",\"mobile\":\"upload/images/2022/9/9/2_mobile.jpeg\",\"mobile_w\":\"upload/images/2022/9/9/2_mobile.webp\",\"desktop\":\"upload/images/2022/9/9/2_desktop.jpeg\"}', '', 1, 1, 1, '[1,2,3]', 1, NULL, NULL, NULL, 1662730510, 1, 771, 480);
INSERT INTO `images` VALUES (3, '2513c764db6c0473c0a16042363b03a5.jpg', 'G:\\work c\\work\\nkms\\photobank_api\\upload/images/2022/9/9/3_full.jpeg', '{\"full\":\"upload/images/2022/9/9/3_full.jpeg\",\"full_w\":\"upload/images/2022/9/9/3_full.webp\",\"desktop\":\"upload/images/2022/9/9/3_desktop.jpeg\",\"tablet\":\"upload/images/2022/9/9/3_tablet.jpeg\",\"desktop_w\":\"upload/images/2022/9/9/3_desktop.webp\",\"tablet_w\":\"upload/images/2022/9/9/3_tablet.webp\",\"mobile\":\"upload/images/2022/9/9/3_mobile.jpeg\",\"mobile_w\":\"upload/images/2022/9/9/3_mobile.webp\"}', '', 1, 1, 1, '[1,2,3]', 1, NULL, NULL, NULL, 1662730510, 1, 350, 263);

INSERT INTO `images_authors` VALUES (1, 'админ');

INSERT INTO `images_sources` VALUES (1, 'интернеты');

INSERT INTO `logs` VALUES (1662730509, 1, '/photobank/create', '{\"user_id\":1}', '192.168.0.12', 'create');

INSERT INTO `tags` VALUES (1, 'красота', 'krasota', 1);
INSERT INTO `tags` VALUES (2, 'уау', 'uau', 1);
INSERT INTO `tags` VALUES (3, 'четко', 'chetko', 1);

INSERT INTO `used_images` VALUES (1, 1, 1662730633, 'Тестовый пользователь использовал');

SET FOREIGN_KEY_CHECKS = 1;