/*
 * Demand Management System - Seed Data
 * Database: painel_demandas
 * Version: 1.0.0
 */

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. INITIAL ORGANIZATION
-- -----------------------------------------------------------------------------

INSERT INTO `organizations` (`id`, `name`, `code`, `type`, `active`) VALUES
(1, 'Governo Municipal', 'GOV', 'MUNICIPALITY', TRUE);

-- -----------------------------------------------------------------------------
-- 2. ROLES
-- -----------------------------------------------------------------------------

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'SUPER_ADMIN', 'Full system access. Cannot be deleted.'),
(2, 'ADMIN', 'Administrative access to specific areas.'),
(3, 'MANAGER', 'Can manage demands and view reports.'),
(4, 'ANALYST', 'Can work on demands.'),
(5, 'VIEWER', 'Read-only access.');

-- -----------------------------------------------------------------------------
-- 3. PERMISSIONS
-- -----------------------------------------------------------------------------

INSERT INTO `permissions` (`id`, `code`, `description`) VALUES
-- USER MANAGEMENT
(1, 'user.create', 'Create new users'),
(2, 'user.edit', 'Edit user profile'),
(3, 'user.delete', 'Deactivate users'),
(4, 'user.reset_password', 'Reset user password'),
(5, 'user.view_audit', 'View audit logs'),

-- DEMAND MANAGEMENT
(6, 'demand.create', 'Create demands'),
(7, 'demand.edit', 'Edit demands'),
(8, 'demand.delete', 'Delete demands'),
(9, 'demand.assign', 'Assign responsible'),
(10, 'demand.view_all', 'View all demands in organization'),

-- REPORTING
(11, 'report.generate', 'Generate reports'),
(12, 'report.export', 'Export data');

-- -----------------------------------------------------------------------------
-- 4. ROLE PERMISSIONS
-- -----------------------------------------------------------------------------

-- SUPER_ADMIN gets ALL permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM `permissions`;

-- ADMIN
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), -- User Mgmt
(2, 6), (2, 7), (2, 8), (2, 9), (2, 10), -- Demand Mgmt
(2, 11), (2, 12); -- Reports

-- MANAGER
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(3, 6), (3, 7), (3, 9), (3, 10), -- Demand Mgmt (No delete)
(3, 11), (3, 12); -- Reports

-- ANALYST
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(4, 6), (4, 7), -- Can create/edit own
(4, 10); -- View all (usually) or limited

-- VIEWER
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(5, 10);

-- -----------------------------------------------------------------------------
-- 5. SUPER ADMINISTRATOR
-- -----------------------------------------------------------------------------

-- Password should be typically hashed. Here we use a placeholder or default hashed password.
-- For production, this MUST be changed immediately.
-- Default Password: 'ChangeMe123!' (Example hash)

INSERT INTO `users` (
    `id`, 
    `organization_id`, 
    `full_name`, 
    `email`, 
    `password_hash`, 
    `status`, 
    `force_password_change`
) VALUES (
    1,
    1,
    'Super Administrator',
    'matheushsc1999@gmail.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 'password' (bcrypt) - CHANGE ON DEPLOY
    'ACTIVE',
    TRUE -- Force change on first login
);

-- Assign SUPER_ADMIN role
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES (1, 1);

-- Assign Organization
INSERT INTO `user_organizations` (`user_id`, `organization_id`, `is_primary`) VALUES (1, 1, TRUE);

SET FOREIGN_KEY_CHECKS = 1;
