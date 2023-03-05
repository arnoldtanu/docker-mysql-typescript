CREATE TABLE `debt` (
  `uuid` binary(16) NOT NULL,
  `debtor` binary(16) NOT NULL,
  `lender` binary(16) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `transaction_ref` binary(16) NOT NULL,
  `created_at` datetime NOT NULL,
  `is_paid` tinyint(1) NOT NULL,
  `updated_at` datetime NOT NULL
);

ALTER TABLE `debt`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `debtor` (`debtor`,`created_at`) USING BTREE,
  ADD KEY `debtor_2` (`debtor`,`is_paid`),
  ADD KEY `lender` (`lender`,`is_paid`);

CREATE TABLE `transaction` (
  `uuid` binary(16) NOT NULL,
  `sender` binary(16) NOT NULL,
  `receiver` binary(16) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `trans_type` enum('Deposit','Transfer','Debt','Withdraw') NOT NULL,
  `created_at` datetime NOT NULL
);

ALTER TABLE `transaction`
  ADD PRIMARY KEY (`uuid`);

CREATE TABLE `user` (
  `uuid` binary(16) NOT NULL,
  `name` varchar(255) NOT NULL,
  `balance` bigint(20) NOT NULL,
  `outstanding_debt` bigint(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
);

ALTER TABLE `user`
  ADD PRIMARY KEY (`uuid`);

ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY 'password'; 
flush privileges;