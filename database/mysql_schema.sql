-- MySQL Schema for RIS Portal

-- ==========================================
-- TABLES
-- ==========================================

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('superadmin','admin','admin_administrative','employee') DEFAULT 'employee',
  `department` VARCHAR(100) DEFAULT NULL,
  `division` VARCHAR(100) DEFAULT NULL,
  `office` VARCHAR(100) DEFAULT NULL,
  `designation` VARCHAR(100) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);

CREATE TABLE `inventory_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `stock_no` VARCHAR(20) NOT NULL UNIQUE,
  `description` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `category_prefix` VARCHAR(2) NOT NULL,
  `unit` VARCHAR(30) NOT NULL,
  `quantity` INT DEFAULT 0,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `is_available` TINYINT(1) DEFAULT 0,
  `created_by` INT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);

CREATE TABLE `ris_forms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ris_no` VARCHAR(50) DEFAULT NULL,
  `entity_name` VARCHAR(200) DEFAULT NULL,
  `fund_cluster` VARCHAR(100) DEFAULT NULL,
  `division` VARCHAR(100) DEFAULT NULL,
  `office` VARCHAR(100) DEFAULT NULL,
  `responsibility_center_code` VARCHAR(100) DEFAULT NULL,
  `purpose` TEXT DEFAULT NULL,
  `status` ENUM('draft','sent','received','ris_no_assigned') DEFAULT 'draft',
  `employee_id` INT DEFAULT NULL,
  `admin_department` VARCHAR(100) DEFAULT NULL,
  `requested_by_name` VARCHAR(150) DEFAULT NULL,
  `requested_by_designation` VARCHAR(100) DEFAULT NULL,
  `requested_by_date` DATE DEFAULT NULL,
  `approved_by_name` VARCHAR(150) DEFAULT NULL,
  `approved_by_designation` VARCHAR(100) DEFAULT NULL,
  `approved_by_date` DATE DEFAULT NULL,
  `issued_by_name` VARCHAR(150) DEFAULT NULL,
  `issued_by_designation` VARCHAR(100) DEFAULT NULL,
  `issued_by_date` DATE DEFAULT NULL,
  `received_by_name` VARCHAR(150) DEFAULT NULL,
  `received_by_designation` VARCHAR(100) DEFAULT NULL,
  `received_by_date` DATE DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);

CREATE TABLE `ris_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ris_id` INT NOT NULL,
  `stock_no` VARCHAR(20) DEFAULT NULL,
  `unit` VARCHAR(30) DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `quantity_requisition` INT DEFAULT 0,
  `stock_available_yes` TINYINT(1) DEFAULT 0,
  `stock_available_no` TINYINT(1) DEFAULT 0,
  `quantity_issue` INT DEFAULT 0,
  `remarks` VARCHAR(255) DEFAULT NULL,
  `row_order` INT DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);

CREATE TABLE `reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_type` ENUM('monthly','quarterly','semestral','yearly') NOT NULL,
  `period_label` VARCHAR(50) NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `generated_by` INT DEFAULT NULL,
  `is_auto` TINYINT(1) DEFAULT 0,
  `report_data` LONGTEXT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);

-- ==========================================
-- RELATIONSHIPS (FOREIGN KEYS)
-- ==========================================

ALTER TABLE `inventory_items`
  ADD CONSTRAINT `fk_inventory_created_by` 
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ris_forms`
  ADD CONSTRAINT `fk_ris_employee_id` 
  FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ris_items`
  ADD CONSTRAINT `fk_ris_items_ris_id` 
  FOREIGN KEY (`ris_id`) REFERENCES `ris_forms` (`id`) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- RIS POLICIES & ACCESS CONTROL
-- (Enforced via Node.js Backend Controllers)
-- ==========================================
/*
  1. CREATION POLICY:
     - Any authenticated 'employee' can create a draft RIS.
     - The 'employee_id' is automatically set to the creator's user ID.
     - The 'admin_department' is inherited from the creator's department.

  2. READ/VIEW POLICY:
     - Employees: Can only view RIS forms where `employee_id` matches their own ID.
     - Department Admins: Can view all RIS forms where `admin_department` matches their department AND status is NOT 'draft'.
     - Superadmins: Can view all RIS forms across all departments.

  3. UPDATE/EDIT POLICY:
     - Employees: Can only edit their own RIS forms IF the status is 'draft'.
     - Once status changes to 'sent', employees can no longer edit the RIS.
     - Admins: Can assign 'ris_no' and mark as 'received' for RIS forms in their department.

  4. DELETION POLICY:
     - Deleting a RIS form (ris_forms) will automatically delete all associated items (ris_items) due to ON DELETE CASCADE.
*/
