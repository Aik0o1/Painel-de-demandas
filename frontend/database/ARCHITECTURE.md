# System Architecture: Demand Management System (Painel Demandas)

## Overview
This document outlines the architecture for the **Demand Management System** database, designed for high performance, auditability, and multi-tenant reporting on shared MySQL hosting.

## 1. Database Specifications
- **Database Name**: `painel_demandas`
- **Engine**: InnoDB
- **Character Set**: `utf8mb4` (Full Unicode support including Emojis)
- **Timezone**: UTC (Application layer should handle local conversions)

## 2. Core Constraints & Principles

### Soft Deletes
All critical tables (`users`, `organizations`, `demands`) implment a `deleted_at` timestamp.
- **Rule**: Never run `DELETE FROM table`.
- **Querying**: Always include `WHERE deleted_at IS NULL`.

### Auditability
Restricted actions must be logged in `audit_logs`.
- **Triggers vs App Logic**: Given shared hosting limitations, audit logic is deferred to the Application Layer (API), but the schema supports full traceability.

### Multi-Tenancy
The system uses **Logical Separation** via `organization_id`.
- Every demand belongs to an organization.
- Users can be linked to multiple organizations via `user_organizations`.

## 3. Schema Modules

### Auth Module (`users`, `roles`, `permissions`)
- **RBAC (Role-Based Access Control)** implementation.
- **Roles**: SUPER_ADMIN (Fixed), ADMIN, MANAGER, ANALYST, VIEWER.
- **Passwords**: Bcrypt/Argon2 hashes.
- **Security Features**:
    - `force_password_change`: Enforce reset on first login or after admin reset.
    - `status`: ACTIVE, INACTIVE, BLOCKED.
    - `password_resets`: Secure token-based reset flow.

### Demand Core (`demands`)
- **Statuses**: Configurable via `demand_statuses`.
- **Priorities**: Configurable via `demand_priorities` with SLA definitions.
- **Full Text Search**: Enabled on `title` and `description` for fast retrieval.

### AI Integration (`ai_analysis_logs`)
- Stores metadata extracted from PDF attachments.
- **Risk Score**: 0.00 to 100.00 indicating potential issues in the document.

## 4. Analytical Views (BI Layer)

The system exposes SQL Views to simplify dashboard queries and protect the normalized schema structure.

| View Name | Purpose |
|-----------|---------|
| `vw_total_demandas` | Aggregate counts by status/org |
| `vw_sla_geral` | Average resolution times |
| `vw_taxa_conclusao_mensal` | Monthly completion % |
| `vw_produtividade_usuarios` | User performance metrics |
| `vw_risco_ai_demandas` | AI Risk assessment summary |

## 5. Deployment Guide

1. **Create Database**:
   ```sql
   CREATE DATABASE painel_demandas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Run Schema**:
   Import `01_schema.sql`

3. **Run Views**:
   Import `02_views.sql`

6. **Run Seeds**:
   Import `03_seeds.sql` (Creates Super Admin & Roles)

4. **Environment Variables**:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=painel_demandas
   DB_USERNAME=your_user
   DB_PASSWORD=your_password
   ```

## 6. Security Checklist
- [ ] Ensure `DB_DEBUG` is false in production.
- [ ] Rotate database credentials periodically.
- [ ] Ensure daily backups of the MySQL database.
