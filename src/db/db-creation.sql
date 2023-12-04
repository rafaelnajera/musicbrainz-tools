CREATE TABLE `data_cache` (
    `id` int NOT NULL auto_increment primary key ,
    `cache_key` varchar(512) NOT NULL unique key,
    `value` longblob,
    `set_at` datetime(6) NOT NULL,
    `expires` datetime(6) NOT NULL DEFAULT '9999-12-31 23:59:59.999999'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
