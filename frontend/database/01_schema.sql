/*
 * Demand Management System - Database Schema
 * Database: painel_demandas
 * Version: 1.0.0
 * Engine: InnoDB
 * Charset: utf8mb4
 * Collation: utf8mb4_unicode_ci
 */

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. ORGANIZATIONAL STRUCTURE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `organizations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `parent_id` BIGINT UNSIGNED NULL COMMENT 'Self-reference for hierarchy (e.g., Secretaria -> Departamento)',
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NULL COMMENT 'Internal code/acronym',
    `type` ENUM('MUNICIPALITY', 'SECRETARIAT', 'DEPARTMENT', 'SECTOR') NOT NULL DEFAULT 'SECTOR',
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_org_parent` (`parent_id`),
    INDEX `idx_org_active` (`active`),
    FOREIGN KEY (`parent_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. USERS & ACCESS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL COMMENT 'Primary organization',
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    `force_password_change` BOOLEAN NOT NULL DEFAULT FALSE,
    `last_password_reset_at` TIMESTAMP NULL,
    `last_login` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_email` (`email`, `deleted_at`),
    INDEX `idx_user_org` (`organization_id`),
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `password_resets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `generated_by_user_id` BIGINT UNSIGNED NULL COMMENT 'Admin who generated the reset',
    `reset_token_hash` VARCHAR(255) NOT NULL,
    `temporary_password_hash` VARCHAR(255) NULL,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_reset_user` (`user_id`),
    INDEX `idx_reset_token` (`reset_token_hash`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`generated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL COMMENT 'e.g., ADMIN, MANAGER, ANALYST, VIEWER',
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_role_name` (`name`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `permissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL COMMENT 'e.g., demand.create, report.view',
    `description` VARCHAR(255) NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_perm_code` (`code`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `role_permissions` (
    `role_id` BIGINT UNSIGNED NOT NULL,
    `permission_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `user_roles` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `role_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `user_organizations` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`user_id`, `organization_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. AUDIT & LOGS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `organization_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, VIEW, EXPORT',
    `entity_table` VARCHAR(100) NOT NULL,
    `entity_id` BIGINT UNSIGNED NOT NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_audit_user` (`user_id`),
    INDEX `idx_audit_entity` (`entity_table`, `entity_id`),
    INDEX `idx_audit_date` (`created_at`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `login_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `email` VARCHAR(255) NOT NULL,
    `status` ENUM('SUCCESS', 'FAILURE') NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_login_user` (`user_id`),
    INDEX `idx_login_date` (`created_at`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. DEMAND MANAGEMENT (CORE)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `demand_statuses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'pending, in_progress, completed, cancelled',
    `color` VARCHAR(20) NULL DEFAULT '#cccccc',
    `is_final` BOOLEAN NOT NULL DEFAULT FALSE,
    `display_order` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `demand_priorities` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'low, medium, high, critical',
    `sla_hours` INT NULL COMMENT 'Expected resolution time in hours',
    `color` VARCHAR(20) NULL DEFAULT '#cccccc',
    `level` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `demand_types` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `demands` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL COMMENT 'Owner organization',
    `requester_id` BIGINT UNSIGNED NOT NULL,
    `responsible_id` BIGINT UNSIGNED NULL,
    `type_id` BIGINT UNSIGNED NULL,
    `status_id` BIGINT UNSIGNED NOT NULL,
    `priority_id` BIGINT UNSIGNED NOT NULL,
    
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    
    `due_date` DATE NULL,
    `started_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    
    PRIMARY KEY (`id`),
    INDEX `idx_demand_org` (`organization_id`),
    INDEX `idx_demand_responsible` (`responsible_id`),
    INDEX `idx_demand_status` (`status_id`),
    INDEX `idx_demand_priority` (`priority_id`),
    INDEX `idx_demand_dates` (`created_at`, `due_date`),
    FULLTEXT `ft_demand_text` (`title`, `description`),
    
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`),
    FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`type_id`) REFERENCES `demand_types`(`id`),
    FOREIGN KEY (`status_id`) REFERENCES `demand_statuses`(`id`),
    FOREIGN KEY (`priority_id`) REFERENCES `demand_priorities`(`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. DEMAND WORKFLOW & HISTORY
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `demand_status_history` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `demand_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL COMMENT 'Who made the change',
    `old_status_id` BIGINT UNSIGNED NULL,
    `new_status_id` BIGINT UNSIGNED NOT NULL,
    `comment` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_hist_demand` (`demand_id`),
    FOREIGN KEY (`demand_id`) REFERENCES `demands`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `demand_comments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `demand_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `content` TEXT NOT NULL,
    `is_internal` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'If true, visible only to internal team',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_comm_demand` (`demand_id`),
    FOREIGN KEY (`demand_id`) REFERENCES `demands`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `attachment_types` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `mime_type` VARCHAR(100) NOT NULL,
    `extension` VARCHAR(20) NOT NULL,
    `icon` VARCHAR(50) NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `demand_attachments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `demand_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Uploader',
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(512) NOT NULL,
    `file_size` BIGINT UNSIGNED NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_attach_demand` (`demand_id`),
    FOREIGN KEY (`demand_id`) REFERENCES `demands`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. TIME TRACKING & METRICS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `work_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `demand_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `started_at` TIMESTAMP NOT NULL,
    `ended_at` TIMESTAMP NULL,
    `duration_minutes` INT NULL,
    `description` VARCHAR(255) NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_work_demand` (`demand_id`),
    INDEX `idx_work_user` (`user_id`),
    FOREIGN KEY (`demand_id`) REFERENCES `demands`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 7. AI & AUTOMATION
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `ai_analysis_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `attachment_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `extracted_data` JSON NULL,
    `risk_score` DECIMAL(5,2) NULL,
    `analysis_text` TEXT NULL,
    `model_version` VARCHAR(50) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_ai_attachment` (`attachment_id`),
    FOREIGN KEY (`attachment_id`) REFERENCES `demand_attachments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 8. REPORTING
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `report_types` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `template_structure` JSON NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `report_generated_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `report_type_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `filters_applied` JSON NULL,
    `file_path` VARCHAR(512) NULL,
    `generated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`report_type_id`) REFERENCES `report_types`(`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `report_snapshots` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `snapshot_date` DATE NOT NULL,
    `data_summary` JSON NOT NULL COMMENT 'Aggregated data for correct historical comparison',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_snap_date` (`snapshot_date`)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
