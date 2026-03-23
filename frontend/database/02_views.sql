/*
 * Demand Management System - Analytical Views
 * Database: painel_demandas
 * Version: 1.0.0
 */

-- -----------------------------------------------------------------------------
-- 1. KPI WRAPPERS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW `vw_total_demandas` AS
SELECT 
    d.organization_id,
    o.name AS organization_name,
    COUNT(d.id) AS total,
    SUM(CASE WHEN ds.code = 'pending' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN ds.code = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
    SUM(CASE WHEN ds.code = 'completed' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN ds.code = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
FROM demands d
JOIN demand_statuses ds ON d.status_id = ds.id
JOIN organizations o ON d.organization_id = o.id
WHERE d.deleted_at IS NULL
GROUP BY d.organization_id, o.name;

CREATE OR REPLACE VIEW `vw_demandas_atrasadas` AS
SELECT 
    d.id,
    d.organization_id,
    d.title,
    d.due_date,
    d.priority_id,
    dp.name AS priority_name,
    u.name AS responsible_name
FROM demands d
JOIN demand_statuses ds ON d.status_id = ds.id
JOIN demand_priorities dp ON d.priority_id = dp.id
LEFT JOIN users u ON d.responsible_id = u.id
WHERE d.deleted_at IS NULL 
  AND d.due_date < CURDATE()
  AND ds.is_final = FALSE;

CREATE OR REPLACE VIEW `vw_taxa_conclusao_mensal` AS
SELECT 
    DATE_FORMAT(d.created_at, '%Y-%m') AS month_year,
    d.organization_id,
    COUNT(d.id) AS total_created,
    SUM(CASE WHEN ds.code = 'completed' THEN 1 ELSE 0 END) AS total_completed,
    ROUND(
        (SUM(CASE WHEN ds.code = 'completed' THEN 1 ELSE 0 END) / COUNT(d.id)) * 100, 
        2
    ) AS completion_rate
FROM demands d
JOIN demand_statuses ds ON d.status_id = ds.id
WHERE d.deleted_at IS NULL
GROUP BY DATE_FORMAT(d.created_at, '%Y-%m'), d.organization_id;

-- -----------------------------------------------------------------------------
-- 2. SLA & PRODUCTIVITY
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW `vw_sla_geral` AS
SELECT 
    d.organization_id,
    AVG(TIMESTAMPDIFF(HOUR, d.created_at, d.completed_at)) AS avg_resolution_time_hours,
    AVG(CASE 
        WHEN dp.code = 'critical' THEN TIMESTAMPDIFF(HOUR, d.created_at, d.completed_at) 
        ELSE NULL 
    END) AS avg_critical_resolution_time
FROM demands d
JOIN demand_priorities dp ON d.priority_id = dp.id
JOIN demand_statuses ds ON d.status_id = ds.id
WHERE d.deleted_at IS NULL 
  AND ds.code = 'completed'
  AND d.completed_at IS NOT NULL
GROUP BY d.organization_id;

CREATE OR REPLACE VIEW `vw_produtividade_usuarios` AS
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    u.organization_id,
    COUNT(DISTINCT d.id) AS assigned_demands,
    SUM(CASE WHEN ds.code = 'completed' THEN 1 ELSE 0 END) AS completed_demands,
    AVG(ws.duration_minutes) AS avg_session_duration,
    SUM(ws.duration_minutes) / 60 AS total_hours_logged
FROM users u
LEFT JOIN demands d ON d.responsible_id = u.id AND d.deleted_at IS NULL
LEFT JOIN demand_statuses ds ON d.status_id = ds.id
LEFT JOIN work_sessions ws ON ws.user_id = u.id
WHERE u.active = TRUE
GROUP BY u.id, u.name, u.organization_id;

-- -----------------------------------------------------------------------------
-- 3. EXECUTIVE DASHBOARD FEEDS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW `vw_backlog_por_organizacao` AS
SELECT 
    o.id AS organization_id,
    o.name AS organization_name,
    COUNT(d.id) AS quantity,
    dp.name AS priority
FROM demands d
JOIN organizations o ON d.organization_id = o.id
JOIN demand_priorities dp ON d.priority_id = dp.id
JOIN demand_statuses ds ON d.status_id = ds.id
WHERE d.deleted_at IS NULL 
  AND ds.is_final = FALSE
GROUP BY o.id, o.name, dp.name;

CREATE OR REPLACE VIEW `vw_tendencia_temporal` AS
SELECT 
    DATE(d.created_at) AS date,
    d.organization_id,
    COUNT(d.id) AS created_count,
    SUM(CASE WHEN ds.code = 'completed' AND DATE(d.completed_at) = DATE(d.created_at) THEN 1 ELSE 0 END) AS completed_same_day
FROM demands d
JOIN demand_statuses ds ON d.status_id = ds.id
WHERE d.deleted_at IS NULL 
  AND d.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(d.created_at), d.organization_id;

-- -----------------------------------------------------------------------------
-- 4. AI & RISK ANALYSIS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW `vw_risco_ai_demandas` AS
SELECT 
    d.id AS demand_id,
    d.title,
    MAX(aal.risk_score) AS max_risk_detected,
    COUNT(aal.id) AS analyzed_files
FROM demands d
JOIN demand_attachments da ON da.demand_id = d.id
JOIN ai_analysis_logs aal ON aal.attachment_id = da.id
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.title;
