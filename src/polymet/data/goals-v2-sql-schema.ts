/**
 * SQL Schema for Goals & Objectives v2
 *
 * Tables:
 * - goals_v2: Main goals table
 * - goal_kpis_v2: KPIs linked to goals
 * - goal_owners_v2: Ownership relationships
 * - goal_dependencies_v2: Goal dependencies (with cycle detection)
 * - goal_tags_v2: Tags for goals
 * - stakeholders_v2: Stakeholders table
 *
 * Features:
 * - Foreign key constraints
 * - Updated_at triggers
 * - Useful indexes
 * - Cycle detection function
 */

export const SQL_SCHEMA = `
-- ============================================================================
-- STAKEHOLDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS stakeholders_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  "group" VARCHAR(100) NOT NULL CHECK ("group" IN (
    'Board', 'CEO', 'CFO & Finance', 'CRO / Risk', 'COO & Operations',
    'CIO / CISO (IT)', 'CHRO / HR', 'Compliance & Legal', 'Internal Audit',
    'BU Leader', 'Procurement & Supply Chain', 'Product/Project',
    'External Auditor', 'Regulator', 'Investor/Shareholder', 'Lender/Insurer',
    'Crisis Team', 'Employee', 'Other'
  )),
  type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'team', 'external')),
  tenant_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stakeholders_v2_tenant ON stakeholders_v2(tenant_id);
CREATE INDEX idx_stakeholders_v2_group ON stakeholders_v2("group");
CREATE INDEX idx_stakeholders_v2_name ON stakeholders_v2(name);

-- ============================================================================
-- GOALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS goals_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL CHECK (category IN (
    'Financial', 'Operational', 'Strategic', 'Compliance & Regulatory',
    'People & Culture', 'Resilience & Continuity', 'Technology & Digital',
    'Sustainability & ESG', 'Customer & Market', 'Innovation & Learning'
  )),
  statement TEXT NOT NULL CHECK (LENGTH(statement) >= 10 AND LENGTH(statement) <= 600),
  description TEXT,
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
  time_horizon VARCHAR(50) NOT NULL CHECK (time_horizon IN ('short_term', 'mid_term', 'long_term')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'retired')),
  tenant_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

CREATE INDEX idx_goals_v2_tenant ON goals_v2(tenant_id);
CREATE INDEX idx_goals_v2_category ON goals_v2(category);
CREATE INDEX idx_goals_v2_status ON goals_v2(status);
CREATE INDEX idx_goals_v2_priority ON goals_v2(priority);
CREATE INDEX idx_goals_v2_time_horizon ON goals_v2(time_horizon);
CREATE INDEX idx_goals_v2_created_at ON goals_v2(created_at DESC);

-- ============================================================================
-- GOAL KPIs TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS goal_kpis_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals_v2(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(100),
  target NUMERIC,
  range_min NUMERIC,
  range_max NUMERIC,
  direction VARCHAR(50) NOT NULL CHECK (direction IN ('higher_is_better', 'lower_is_better', 'range')),
  measurement_freq VARCHAR(50) NOT NULL CHECK (measurement_freq IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT kpi_target_or_range CHECK (
    (target IS NOT NULL) OR (range_min IS NOT NULL AND range_max IS NOT NULL)
  )
);

CREATE INDEX idx_goal_kpis_v2_goal ON goal_kpis_v2(goal_id);

-- ============================================================================
-- GOAL OWNERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS goal_owners_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals_v2(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES stakeholders_v2(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'co_owner', 'contributor', 'consumer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, stakeholder_id, role)
);

CREATE INDEX idx_goal_owners_v2_goal ON goal_owners_v2(goal_id);
CREATE INDEX idx_goal_owners_v2_stakeholder ON goal_owners_v2(stakeholder_id);
CREATE INDEX idx_goal_owners_v2_role ON goal_owners_v2(role);

-- ============================================================================
-- GOAL DEPENDENCIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS goal_dependencies_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals_v2(id) ON DELETE CASCADE,
  depends_on_goal_id UUID REFERENCES goals_v2(id) ON DELETE CASCADE,
  enables_goal_id UUID REFERENCES goals_v2(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT dependency_type_check CHECK (
    (depends_on_goal_id IS NOT NULL AND enables_goal_id IS NULL) OR
    (depends_on_goal_id IS NULL AND enables_goal_id IS NOT NULL)
  ),
  CONSTRAINT no_self_dependency CHECK (
    goal_id != COALESCE(depends_on_goal_id, enables_goal_id)
  )
);

CREATE INDEX idx_goal_dependencies_v2_goal ON goal_dependencies_v2(goal_id);
CREATE INDEX idx_goal_dependencies_v2_depends ON goal_dependencies_v2(depends_on_goal_id);
CREATE INDEX idx_goal_dependencies_v2_enables ON goal_dependencies_v2(enables_goal_id);

-- ============================================================================
-- GOAL TAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS goal_tags_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals_v2(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, tag)
);

CREATE INDEX idx_goal_tags_v2_goal ON goal_tags_v2(goal_id);
CREATE INDEX idx_goal_tags_v2_tag ON goal_tags_v2(tag);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stakeholders_v2
CREATE TRIGGER update_stakeholders_v2_updated_at
  BEFORE UPDATE ON stakeholders_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for goals_v2
CREATE TRIGGER update_goals_v2_updated_at
  BEFORE UPDATE ON goals_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CYCLE DETECTION FUNCTION
-- ============================================================================

/**
 * Detects cycles in goal dependencies using recursive CTE
 * Returns TRUE if adding the dependency would create a cycle
 * 
 * Usage:
 *   SELECT check_goal_dependency_cycle('goal-uuid', 'depends-on-uuid');
 */
CREATE OR REPLACE FUNCTION check_goal_dependency_cycle(
  p_goal_id UUID,
  p_depends_on_goal_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  has_cycle BOOLEAN;
BEGIN
  -- Check if adding this dependency would create a cycle
  -- A cycle exists if p_depends_on_goal_id already depends on p_goal_id (directly or transitively)
  
  WITH RECURSIVE dependency_chain AS (
    -- Base case: direct dependencies of p_depends_on_goal_id
    SELECT 
      goal_id,
      depends_on_goal_id AS next_goal_id,
      1 AS depth
    FROM goal_dependencies_v2
    WHERE goal_id = p_depends_on_goal_id
      AND depends_on_goal_id IS NOT NULL
    
    UNION ALL
    
    -- Recursive case: follow the chain
    SELECT 
      dc.goal_id,
      gd.depends_on_goal_id AS next_goal_id,
      dc.depth + 1
    FROM dependency_chain dc
    JOIN goal_dependencies_v2 gd ON dc.next_goal_id = gd.goal_id
    WHERE gd.depends_on_goal_id IS NOT NULL
      AND dc.depth < 100 -- Prevent infinite loops
  )
  SELECT EXISTS (
    SELECT 1 FROM dependency_chain WHERE next_goal_id = p_goal_id
  ) INTO has_cycle;
  
  RETURN COALESCE(has_cycle, FALSE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Seed stakeholders (8-10 typical stakeholders)
INSERT INTO stakeholders_v2 (id, name, email, "group", type, tenant_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Board of Directors', 'board@democorp.com', 'Board', 'team', 'demo-tenant'),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Chen', 'sarah.chen@democorp.com', 'CEO', 'individual', 'demo-tenant'),
  ('33333333-3333-3333-3333-333333333333', 'Michael Rodriguez', 'michael.r@democorp.com', 'CFO & Finance', 'individual', 'demo-tenant'),
  ('44444444-4444-4444-4444-444444444444', 'Emily Watson', 'emily.w@democorp.com', 'CRO / Risk', 'individual', 'demo-tenant'),
  ('55555555-5555-5555-5555-555555555555', 'David Kim', 'david.kim@democorp.com', 'COO & Operations', 'individual', 'demo-tenant'),
  ('66666666-6666-6666-6666-666666666666', 'Lisa Thompson', 'lisa.t@democorp.com', 'CIO / CISO (IT)', 'individual', 'demo-tenant'),
  ('77777777-7777-7777-7777-777777777777', 'James Martinez', 'james.m@democorp.com', 'CHRO / HR', 'individual', 'demo-tenant'),
  ('88888888-8888-8888-8888-888888888888', 'Compliance Team', 'compliance@democorp.com', 'Compliance & Legal', 'team', 'demo-tenant'),
  ('99999999-9999-9999-9999-999999999999', 'Product Innovation Team', 'product@democorp.com', 'Product/Project', 'team', 'demo-tenant'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Internal Audit', 'audit@democorp.com', 'Internal Audit', 'team', 'demo-tenant')
ON CONFLICT (id) DO NOTHING;

-- Seed goals (6 sample goals spanning different categories)
INSERT INTO goals_v2 (id, category, statement, description, priority, time_horizon, status, tenant_id, created_by) VALUES
  (
    'g1111111-1111-1111-1111-111111111111',
    'Financial',
    'Increase annual recurring revenue by 25% while maintaining gross margin above 70%',
    'Drive sustainable revenue growth through new customer acquisition and expansion of existing accounts',
    5,
    'mid_term',
    'active',
    'demo-tenant',
    'sarah.chen@democorp.com'
  ),
  (
    'g2222222-2222-2222-2222-222222222222',
    'Operational',
    'Reduce operational incidents by 40% through improved monitoring and automation',
    'Enhance system reliability and reduce manual intervention through proactive monitoring and automated remediation',
    4,
    'short_term',
    'active',
    'demo-tenant',
    'david.kim@democorp.com'
  ),
  (
    'g3333333-3333-3333-3333-333333333333',
    'Strategic',
    'Launch three new product lines in emerging markets by Q4 2025',
    'Expand market presence and diversify revenue streams through strategic product innovation',
    5,
    'long_term',
    'active',
    'demo-tenant',
    'sarah.chen@democorp.com'
  ),
  (
    'g4444444-4444-4444-4444-444444444444',
    'Compliance & Regulatory',
    'Achieve 100% compliance with SOC 2 Type II requirements within 6 months',
    'Strengthen security posture and meet customer compliance requirements',
    4,
    'short_term',
    'active',
    'demo-tenant',
    'compliance@democorp.com'
  ),
  (
    'g5555555-5555-5555-5555-555555555555',
    'People & Culture',
    'Improve employee engagement score to 85% and reduce voluntary turnover to below 10%',
    'Create a positive work environment that attracts and retains top talent',
    3,
    'mid_term',
    'active',
    'demo-tenant',
    'james.m@democorp.com'
  ),
  (
    'g6666666-6666-6666-6666-666666666666',
    'Technology & Digital',
    'Migrate 80% of workloads to cloud infrastructure with 99.9% uptime SLA',
    'Modernize infrastructure to improve scalability, reliability, and cost efficiency',
    4,
    'mid_term',
    'active',
    'demo-tenant',
    'lisa.t@democorp.com'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed KPIs for goals
INSERT INTO goal_kpis_v2 (goal_id, name, unit, target, direction, measurement_freq) VALUES
  ('g1111111-1111-1111-1111-111111111111', 'Annual Recurring Revenue', 'USD', 50000000, 'higher_is_better', 'quarterly'),
  ('g1111111-1111-1111-1111-111111111111', 'Gross Margin', '%', 70, 'higher_is_better', 'quarterly'),
  ('g2222222-2222-2222-2222-222222222222', 'Incident Count', 'incidents', 30, 'lower_is_better', 'monthly'),
  ('g2222222-2222-2222-2222-222222222222', 'Mean Time to Resolution', 'minutes', 60, 'lower_is_better', 'weekly'),
  ('g3333333-3333-3333-3333-333333333333', 'New Product Launches', 'products', 3, 'higher_is_better', 'quarterly'),
  ('g3333333-3333-3333-3333-333333333333', 'Market Penetration', '%', 15, 'higher_is_better', 'quarterly'),
  ('g4444444-4444-4444-4444-444444444444', 'Compliance Score', '%', 100, 'higher_is_better', 'monthly'),
  ('g5555555-5555-5555-5555-555555555555', 'Employee Engagement Score', '%', 85, 'higher_is_better', 'quarterly'),
  ('g5555555-5555-5555-5555-555555555555', 'Voluntary Turnover Rate', '%', 10, 'lower_is_better', 'quarterly'),
  ('g6666666-6666-6666-6666-666666666666', 'Cloud Migration Progress', '%', 80, 'higher_is_better', 'monthly'),
  ('g6666666-6666-6666-6666-666666666666', 'System Uptime', '%', 99.9, 'higher_is_better', 'daily')
ON CONFLICT DO NOTHING;

-- Seed goal owners
INSERT INTO goal_owners_v2 (goal_id, stakeholder_id, role) VALUES
  ('g1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'owner'),
  ('g1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'co_owner'),
  ('g2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'owner'),
  ('g2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'contributor'),
  ('g3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'owner'),
  ('g3333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', 'co_owner'),
  ('g4444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'owner'),
  ('g4444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'contributor'),
  ('g5555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', 'owner'),
  ('g6666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'owner')
ON CONFLICT DO NOTHING;

-- Seed goal dependencies
INSERT INTO goal_dependencies_v2 (goal_id, depends_on_goal_id) VALUES
  ('g3333333-3333-3333-3333-333333333333', 'g1111111-1111-1111-1111-111111111111'), -- Strategic goal depends on financial goal
  ('g6666666-6666-6666-6666-666666666666', 'g2222222-2222-2222-2222-222222222222')  -- Cloud migration depends on operational stability
ON CONFLICT DO NOTHING;

INSERT INTO goal_dependencies_v2 (goal_id, enables_goal_id) VALUES
  ('g4444444-4444-4444-4444-444444444444', 'g3333333-3333-3333-3333-333333333333')  -- Compliance enables strategic expansion
ON CONFLICT DO NOTHING;

-- Seed goal tags
INSERT INTO goal_tags_v2 (goal_id, tag) VALUES
  ('g1111111-1111-1111-1111-111111111111', 'revenue'),
  ('g1111111-1111-1111-1111-111111111111', 'growth'),
  ('g1111111-1111-1111-1111-111111111111', 'profitability'),
  ('g2222222-2222-2222-2222-222222222222', 'reliability'),
  ('g2222222-2222-2222-2222-222222222222', 'automation'),
  ('g3333333-3333-3333-3333-333333333333', 'innovation'),
  ('g3333333-3333-3333-3333-333333333333', 'expansion'),
  ('g4444444-4444-4444-4444-444444444444', 'security'),
  ('g4444444-4444-4444-4444-444444444444', 'compliance'),
  ('g5555555-5555-5555-5555-555555555555', 'culture'),
  ('g5555555-5555-5555-5555-555555555555', 'retention'),
  ('g6666666-6666-6666-6666-666666666666', 'cloud'),
  ('g6666666-6666-6666-6666-666666666666', 'infrastructure')
ON CONFLICT DO NOTHING;
`;

export type GoalsV2SqlSchema = typeof SQL_SCHEMA;
