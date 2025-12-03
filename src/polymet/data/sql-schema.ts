/**
 * # SQL Schema for Retina Decision System
 *
 * PostgreSQL DDL for decisions, simulation_snapshots, and assumptions tables.
 * Includes proper indexes, constraints, and RBAC considerations.
 *
 * ## Features
 * - Multi-tenant isolation with tenant_id
 * - JSONB columns for flexible nested data
 * - Proper indexes for common queries
 * - Foreign key constraints
 * - Timestamps with timezone support
 * - Row-level security (RLS) ready
 */

export const SQL_SCHEMA = `
-- ============================================================================
-- DECISIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS decisions (
  -- Primary key
  id VARCHAR(100) PRIMARY KEY,
  
  -- Multi-tenancy
  tenant_id VARCHAR(50) NOT NULL,
  
  -- Basic fields
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'analyzing', 'deciding', 'closed')),
  chosen_option_id VARCHAR(100),
  
  -- Options (JSONB array)
  options JSONB NOT NULL DEFAULT '[]'::JSONB,
  
  -- Signals and incidents
  linked_signals JSONB,
  incident_impact JSONB,
  
  -- Timestamps
  created_at BIGINT NOT NULL,
  closed_at BIGINT,
  closed_by VARCHAR(200),
  
  -- Portfolio link
  portfolio_id VARCHAR(100),
  
  -- Metrics (JSONB object)
  metrics JSONB,
  
  -- Closure configuration
  basis_at_close VARCHAR(10) CHECK (basis_at_close IN ('RAROC', 'CE')),
  horizon_months_at_close INTEGER CHECK (horizon_months_at_close BETWEEN 1 AND 240),
  achieved_spearman_at_close NUMERIC(5, 4) CHECK (achieved_spearman_at_close BETWEEN -1 AND 1),
  
  -- Bayesian configuration at close
  bayes_at_close JSONB,
  
  -- Copula metrics at close
  copula_fro_err_at_close NUMERIC(10, 6) CHECK (copula_fro_err_at_close >= 0),
  
  -- Assumptions at close
  critical_open_at_close INTEGER CHECK (critical_open_at_close >= 0),
  locked_assumptions JSONB,
  
  -- Sensitivity analysis
  top_sensitive_factors JSONB,
  
  -- Credit risk
  credit_risk_score NUMERIC(5, 2) CHECK (credit_risk_score BETWEEN 0 AND 100),
  
  -- Auto-refresh
  last_refreshed_at BIGINT,
  
  -- Simulation configuration (for auto-refresh)
  simulation_results JSONB,
  scenario_vars JSONB,
  seed INTEGER,
  runs INTEGER CHECK (runs BETWEEN 100 AND 100000),
  utility_params JSONB,
  tcor_params JSONB,
  game_config JSONB,
  option_strategies JSONB,
  dependence_config JSONB,
  bayesian_override JSONB,
  copula_config JSONB,
  
  -- Audit fields
  created_by VARCHAR(200),
  updated_at BIGINT,
  updated_by VARCHAR(200),
  
  -- Constraints
  CONSTRAINT decisions_tenant_id_check CHECK (tenant_id ~ '^t-[a-zA-Z0-9-_]+$'),
  CONSTRAINT decisions_closed_fields_check CHECK (
    (status = 'closed' AND chosen_option_id IS NOT NULL AND closed_at IS NOT NULL AND closed_by IS NOT NULL)
    OR (status != 'closed')
  )
);

-- Indexes for decisions
CREATE INDEX IF NOT EXISTS idx_decisions_tenant_id ON decisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_tenant_status ON decisions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_decisions_portfolio_id ON decisions(portfolio_id) WHERE portfolio_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_closed_at ON decisions(closed_at DESC) WHERE closed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decisions_last_refreshed ON decisions(last_refreshed_at DESC) WHERE last_refreshed_at IS NOT NULL;

-- GIN indexes for JSONB columns (for efficient querying)
CREATE INDEX IF NOT EXISTS idx_decisions_options_gin ON decisions USING GIN (options);
CREATE INDEX IF NOT EXISTS idx_decisions_linked_signals_gin ON decisions USING GIN (linked_signals);
CREATE INDEX IF NOT EXISTS idx_decisions_metrics_gin ON decisions USING GIN (metrics);

-- Comments
COMMENT ON TABLE decisions IS 'Strategic decisions with options, metrics, and lifecycle tracking';
COMMENT ON COLUMN decisions.tenant_id IS 'Multi-tenant isolation key';
COMMENT ON COLUMN decisions.status IS 'Decision lifecycle status: draft, analyzing, deciding, closed';
COMMENT ON COLUMN decisions.basis_at_close IS 'Decision basis at closure: RAROC or CE';
COMMENT ON COLUMN decisions.achieved_spearman_at_close IS 'Achieved Spearman rank correlation at closure';
COMMENT ON COLUMN decisions.bayes_at_close IS 'Bayesian prior configuration at closure (varKey, muN, sigmaN, applied)';
COMMENT ON COLUMN decisions.copula_fro_err_at_close IS 'Copula Frobenius error at closure';
COMMENT ON COLUMN decisions.critical_open_at_close IS 'Count of critical open assumptions at closure';
COMMENT ON COLUMN decisions.locked_assumptions IS 'Array of locked assumptions at closure';


-- ============================================================================
-- SIMULATION_SNAPSHOTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS simulation_snapshots (
  -- Primary key (run fingerprint)
  run_id VARCHAR(70) PRIMARY KEY CHECK (run_id ~ '^run-[a-f0-9]{64}$'),
  
  -- Foreign key to decision
  decision_id VARCHAR(100) NOT NULL,
  
  -- Multi-tenancy
  tenant_id VARCHAR(50) NOT NULL,
  
  -- Simulation parameters
  seed INTEGER NOT NULL CHECK (seed >= 0),
  runs INTEGER NOT NULL CHECK (runs BETWEEN 100 AND 100000),
  
  -- Timestamp
  timestamp BIGINT NOT NULL,
  
  -- Correlation
  achieved_spearman NUMERIC(5, 4) CHECK (achieved_spearman BETWEEN -1 AND 1),
  
  -- Bayesian configuration
  bayes JSONB,
  
  -- Assumptions snapshot
  assumptions JSONB,
  
  -- Copula configuration
  copula JSONB,
  
  -- Planning horizon
  horizon_months INTEGER CHECK (horizon_months BETWEEN 1 AND 240),
  
  -- Sensitivity baseline
  sensitivity_baseline JSONB,
  
  -- Metrics by option (JSONB object)
  metrics_by_option JSONB NOT NULL,
  
  -- Audit fields
  created_by VARCHAR(200),
  
  -- Constraints
  CONSTRAINT snapshots_tenant_id_check CHECK (tenant_id ~ '^t-[a-zA-Z0-9-_]+$'),
  CONSTRAINT snapshots_metrics_not_empty CHECK (jsonb_typeof(metrics_by_option) = 'object' AND metrics_by_option != '{}'::JSONB),
  
  -- Foreign key
  CONSTRAINT fk_snapshots_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

-- Indexes for simulation_snapshots
CREATE INDEX IF NOT EXISTS idx_snapshots_decision_id ON simulation_snapshots(decision_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_tenant_id ON simulation_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON simulation_snapshots(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_decision_timestamp ON simulation_snapshots(decision_id, timestamp DESC);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_snapshots_metrics_gin ON simulation_snapshots USING GIN (metrics_by_option);
CREATE INDEX IF NOT EXISTS idx_snapshots_assumptions_gin ON simulation_snapshots USING GIN (assumptions);

-- Comments
COMMENT ON TABLE simulation_snapshots IS 'Snapshots of simulation results with complete configuration';
COMMENT ON COLUMN simulation_snapshots.run_id IS 'Unique run fingerprint (SHA-256 hash of config)';
COMMENT ON COLUMN simulation_snapshots.achieved_spearman IS 'Achieved Spearman rank correlation';
COMMENT ON COLUMN simulation_snapshots.bayes IS 'Bayesian prior configuration (varKey, muN, sigmaN, applied)';
COMMENT ON COLUMN simulation_snapshots.assumptions IS 'Snapshot of assumptions at run time (count, criticalOpen, list)';
COMMENT ON COLUMN simulation_snapshots.copula IS 'Copula matrix config and preview (k, targetSet, froErr, achievedPreview)';
COMMENT ON COLUMN simulation_snapshots.sensitivity_baseline IS 'Baseline for sensitivity analysis (basis, optionId)';
COMMENT ON COLUMN simulation_snapshots.metrics_by_option IS 'Complete metrics for each option';


-- ============================================================================
-- ASSUMPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS assumptions (
  -- Primary key
  id VARCHAR(100) PRIMARY KEY CHECK (id ~ '^asmp-[a-zA-Z0-9-_]+$'),
  
  -- Foreign key to decision
  decision_id VARCHAR(100) NOT NULL,
  
  -- Multi-tenancy
  tenant_id VARCHAR(50) NOT NULL,
  
  -- Scope
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('decision', 'option', 'variable')),
  link_id VARCHAR(100),
  
  -- Content
  statement TEXT NOT NULL CHECK (length(statement) > 0 AND length(statement) <= 1000),
  evidence_url TEXT,
  
  -- Confidence and criticality
  confidence SMALLINT NOT NULL CHECK (confidence IN (0, 1, 2)),
  critical BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Ownership
  owner VARCHAR(200),
  review_by DATE,
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'validated', 'invalidated')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  validated_by VARCHAR(200),
  
  -- Notes
  notes TEXT CHECK (length(notes) <= 2000),
  
  -- Constraints
  CONSTRAINT assumptions_tenant_id_check CHECK (tenant_id ~ '^t-[a-zA-Z0-9-_]+$'),
  
  -- Foreign key
  CONSTRAINT fk_assumptions_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
);

-- Indexes for assumptions
CREATE INDEX IF NOT EXISTS idx_assumptions_decision_id ON assumptions(decision_id);
CREATE INDEX IF NOT EXISTS idx_assumptions_tenant_id ON assumptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assumptions_status ON assumptions(status);
CREATE INDEX IF NOT EXISTS idx_assumptions_critical ON assumptions(critical) WHERE critical = TRUE;
CREATE INDEX IF NOT EXISTS idx_assumptions_scope ON assumptions(scope);
CREATE INDEX IF NOT EXISTS idx_assumptions_decision_status ON assumptions(decision_id, status);
CREATE INDEX IF NOT EXISTS idx_assumptions_decision_critical ON assumptions(decision_id, critical) WHERE critical = TRUE;
CREATE INDEX IF NOT EXISTS idx_assumptions_updated_at ON assumptions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assumptions_review_by ON assumptions(review_by) WHERE review_by IS NOT NULL;

-- Comments
COMMENT ON TABLE assumptions IS 'Assumptions with scope, status, and criticality tracking';
COMMENT ON COLUMN assumptions.scope IS 'Assumption scope: decision, option, or variable';
COMMENT ON COLUMN assumptions.link_id IS 'Optional link to option or variable ID';
COMMENT ON COLUMN assumptions.confidence IS 'Confidence level: 0=low, 1=medium, 2=high';
COMMENT ON COLUMN assumptions.critical IS 'Whether assumption gates decision closure';
COMMENT ON COLUMN assumptions.status IS 'Assumption status: open, validated, or invalidated';


-- ============================================================================
-- AUDIT LOG TABLE (Optional but recommended)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,
  
  -- Timestamp
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Multi-tenancy
  tenant_id VARCHAR(50) NOT NULL,
  
  -- Actor
  actor VARCHAR(200) NOT NULL,
  actor_role VARCHAR(50),
  
  -- Event
  event_type VARCHAR(100) NOT NULL,
  
  -- Payload (JSONB for flexibility)
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Optional entity references
  decision_id VARCHAR(100),
  snapshot_id VARCHAR(70),
  assumption_id VARCHAR(100),
  
  -- Constraints
  CONSTRAINT audit_tenant_id_check CHECK (tenant_id ~ '^t-[a-zA-Z0-9-_]+$')
);

-- Indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_decision_id ON audit_log(decision_id) WHERE decision_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor);

-- GIN index for payload
CREATE INDEX IF NOT EXISTS idx_audit_payload_gin ON audit_log USING GIN (payload);

-- Comments
COMMENT ON TABLE audit_log IS 'Audit trail for all system actions';
COMMENT ON COLUMN audit_log.event_type IS 'Type of event (e.g., decision_created, simulation_run, assumption_validated)';


-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) SETUP
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your auth system)
-- These assume you have a current_tenant_id() function that returns the current user's tenant

-- Policy for decisions
CREATE POLICY tenant_isolation_decisions ON decisions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE));

-- Policy for simulation_snapshots
CREATE POLICY tenant_isolation_snapshots ON simulation_snapshots
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE));

-- Policy for assumptions
CREATE POLICY tenant_isolation_assumptions ON assumptions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE));

-- Policy for audit_log
CREATE POLICY tenant_isolation_audit ON audit_log
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE));


-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = EXTRACT(EPOCH FROM NOW()) * 1000;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for decisions
CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for assumptions (uses TIMESTAMPTZ)
CREATE OR REPLACE FUNCTION update_assumptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assumptions_updated_at
  BEFORE UPDATE ON assumptions
  FOR EACH ROW
  EXECUTE FUNCTION update_assumptions_updated_at();


-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for closed decisions with metrics
CREATE OR REPLACE VIEW closed_decisions_with_metrics AS
SELECT 
  d.id,
  d.tenant_id,
  d.title,
  d.description,
  d.chosen_option_id,
  d.closed_at,
  d.closed_by,
  d.metrics,
  d.basis_at_close,
  d.horizon_months_at_close,
  d.achieved_spearman_at_close,
  d.critical_open_at_close,
  d.credit_risk_score,
  (d.metrics->>'raroc')::NUMERIC AS raroc,
  (d.metrics->>'ev')::NUMERIC AS ev,
  (d.metrics->>'var95')::NUMERIC AS var95
FROM decisions d
WHERE d.status = 'closed';

-- View for critical open assumptions by decision
CREATE OR REPLACE VIEW critical_open_assumptions AS
SELECT 
  a.decision_id,
  a.tenant_id,
  COUNT(*) AS critical_open_count,
  json_agg(
    json_build_object(
      'id', a.id,
      'statement', a.statement,
      'confidence', a.confidence,
      'updated_at', a.updated_at
    )
  ) AS assumptions
FROM assumptions a
WHERE a.critical = TRUE AND a.status = 'open'
GROUP BY a.decision_id, a.tenant_id;

-- View for latest snapshots per decision
CREATE OR REPLACE VIEW latest_snapshots AS
SELECT DISTINCT ON (decision_id)
  *
FROM simulation_snapshots
ORDER BY decision_id, timestamp DESC;


-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample decision
INSERT INTO decisions (
  id, tenant_id, title, description, status, chosen_option_id,
  options, created_at, closed_at, closed_by, metrics, basis_at_close
) VALUES (
  'dec-sample-001',
  't-demo',
  'Cloud Migration Strategy',
  'Evaluate cloud infrastructure options',
  'closed',
  'opt-hybrid',
  '[{"id": "opt-hybrid", "label": "Hybrid Cloud", "score": 0.92}, {"id": "opt-full", "label": "Full Cloud", "score": 0.78}]'::JSONB,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000,
  EXTRACT(EPOCH FROM NOW()) * 1000,
  'Admin User',
  '{"raroc": 0.085, "ev": 1500, "var95": -450, "cvar95": -520, "ce": 1250}'::JSONB,
  'RAROC'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample snapshot
INSERT INTO simulation_snapshots (
  run_id, decision_id, tenant_id, seed, runs, timestamp,
  metrics_by_option
) VALUES (
  'run-0000000000000000000000000000000000000000000000000000000000000001',
  'dec-sample-001',
  't-demo',
  42,
  10000,
  EXTRACT(EPOCH FROM NOW()) * 1000,
  '{"opt-hybrid": {"optionLabel": "Hybrid Cloud", "ev": 1500, "var95": -450, "cvar95": -520, "economicCapital": 450, "raroc": 0.085}}'::JSONB
) ON CONFLICT (run_id) DO NOTHING;

-- Insert sample assumption
INSERT INTO assumptions (
  id, decision_id, tenant_id, scope, statement, confidence, critical, status
) VALUES (
  'asmp-sample-001',
  'dec-sample-001',
  't-demo',
  'decision',
  'Market demand will remain stable',
  2,
  TRUE,
  'validated'
) ON CONFLICT (id) DO NOTHING;
`;

/**
 * Get SQL schema as string
 */
export function getSQLSchema(): string {
  return SQL_SCHEMA;
}

/**
 * Get individual table DDL
 */
export function getTableDDL(
  tableName: "decisions" | "simulation_snapshots" | "assumptions" | "audit_log"
): string {
  const lines = SQL_SCHEMA.split("\n");
  const tableStart = lines.findIndex((line) =>
    line.includes(`CREATE TABLE IF NOT EXISTS ${tableName}`)
  );

  if (tableStart === -1) return "";

  let tableEnd = tableStart;
  let parenCount = 0;

  for (let i = tableStart; i < lines.length; i++) {
    const line = lines[i];
    parenCount += (line.match(/\(/g) || []).length;
    parenCount -= (line.match(/\)/g) || []).length;

    if (parenCount === 0 && line.includes(");")) {
      tableEnd = i;
      break;
    }
  }

  return lines.slice(tableStart, tableEnd + 1).join("\n");
}

/**
 * Export schema to file
 */
export function exportSchemaToFile(): Blob {
  return new Blob([SQL_SCHEMA], { type: "text/plain" });
}
