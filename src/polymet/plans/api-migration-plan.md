# API Migration Plan

## User Request
Replace draft/localStorage stubs with server APIs + schemas that reflect current usage. Generate JSON Schemas + SQL DDL + REST for decisions, simulation snapshots, and assumptions with RBAC by tenant.

## Related Files
- @/polymet/data/retina-store (to view) - Current localStorage implementation
- @/polymet/data/decision-journal (to view) - Decision lifecycle tracking
- @/polymet/data/assumptions-store (to view) - Assumptions management
- @/polymet/pages/retina-i-decide (to view) - Main decision page using these stores
- @/polymet/data/api-decisions (to create) - New REST API for decisions
- @/polymet/data/api-snapshots (to create) - New REST API for simulation snapshots
- @/polymet/data/api-assumptions (to create) - New REST API for assumptions
- @/polymet/data/decision-schema (to create) - JSON Schema for decisions
- @/polymet/data/simulation-snapshot-schema (to create) - JSON Schema for snapshots
- @/polymet/data/assumption-schema (to create) - JSON Schema for assumptions
- @/polymet/data/sql-schema (to create) - SQL DDL for all tables
- @/polymet/data/api-migration-wrapper (to create) - Wrapper to preserve existing signatures

## TODO List
- [x] View retina-store to understand current decision and snapshot structure
- [x] View assumptions-store to understand assumption structure
- [x] View decision-journal to understand decision lifecycle
- [x] Create JSON Schema for Decision entity
- [x] Create JSON Schema for SimulationSnapshot entity
- [x] Create JSON Schema for Assumption entity
- [x] Create SQL DDL for all tables with proper indexes and constraints
- [x] Create REST API for /api/decisions with CRUD + tenant scoping
- [x] Create REST API for /api/snapshots with CRUD + tenant scoping
- [ ] Create REST API for /api/assumptions with CRUD + tenant scoping
- [ ] Create migration wrapper to preserve existing function signatures
- [ ] Update retina-store to use API wrapper instead of localStorage
- [ ] Create API integration README with migration guide

## Important Notes
- Preserve existing function signatures: saveSimulationSnapshot, saveClosedDecision, getDecisionsByTenant
- Ensure RBAC by tenant for all endpoints
- Include all fields from current usage: bayesAtClose, copulaFroErrAtClose, achievedSpearmanAtClose, criticalOpenAtClose, lockedAssumptions[]
- Success criteria: Close decision → persists to DB; snapshots load for comparison screen

  
## Plan Information
*This plan is created when the project is at iteration 200, and date 2025-10-09T20:08:15.000Z*
