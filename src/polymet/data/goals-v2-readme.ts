/**
 * Goals & Objectives v2 System
 * 
 * Comprehensive documentation for the Goals & Objectives management system
 * with SMART validation and stakeholder integration.
 */

# Goals & Objectives v2 System

## Overview

The Goals & Objectives v2 system provides a comprehensive framework for managing organizational goals with built-in SMART validation, stakeholder management, and KPI tracking.

## Key Features

### 1. **SMART Validation**
All goals are validated against SMART criteria before saving:
- **Specific**: Statement must be 10-600 characters
- **Measurable**: At least 1 KPI with target or range
- **Achievable**: Validated through stakeholder assignment
- **Relevant**: Categorized by business area
- **Time-bound**: Time horizon must be set

### 2. **Goal Categories**
Goals are organized into 10 strategic categories:
- Financial
- Operational
- Strategic
- Compliance & Regulatory
- People & Culture
- Resilience & Continuity
- Technology & Digital
- Sustainability & ESG
- Customer & Market
- Innovation & Learning

### 3. **KPI Management**
Each goal can have multiple KPIs with:
- Name and unit of measurement
- Target value or range (min/max)
- Direction (higher is better, lower is better, or range)
- Measurement frequency (daily, weekly, monthly, quarterly, annually)

### 4. **Stakeholder Integration**
Goals are linked to stakeholders with defined roles:
- **Owner**: Primary responsible party
- **Co-owner**: Shared responsibility
- **Contributor**: Supporting role
- **Consumer**: Beneficiary of goal achievement

### 5. **Goal Dependencies**
Track relationships between goals:
- **Depends on**: Goals that must be achieved first
- **Enables**: Goals that become possible after this goal

### 6. **Priority & Time Horizon**
- Priority levels: 1 (Critical) to 5 (Minimal)
- Time horizons: Short-term, Mid-term, Long-term

### 7. **Goal Status Tracking**
- **Draft**: Work in progress
- **Active**: Currently being pursued
- **Paused**: Temporarily on hold
- **Retired**: Completed or no longer relevant

## Schema Structure

### Goal v2 Schema
```typescript
interface GoalV2 {
  id: string; // uuid
  category: GoalCategory;
  statement: string; // 10-600 chars
  description?: string;
  kpis: KPI[];
  priority: 1 | 2 | 3 | 4 | 5;
  time_horizon: "short_term" | "mid_term" | "long_term";
  owners: GoalOwner[];
  related_stakeholders: string[]; // uuid[]
  dependencies: {
    depends_on: string[]; // uuid[]
    enables: string[]; // uuid[]
  };
  tags: string[];
  status: "draft" | "active" | "paused" | "retired";
  created_at: number;
  updated_at: number;
  created_by: string;
  updated_by: string;
}
```

### Stakeholder v2 Schema
```typescript
interface StakeholderV2 {
  id: string; // uuid
  name: string;
  email?: string;
  group: StakeholderGroup;
  type: "individual" | "team" | "external";
  created_at: number;
  updated_at: number;
}
```

## Usage Examples

### Creating a Goal
```typescript
import { createGoalV2, validateSMARTGoal } from "@/polymet/data/goal-v2-schema";

const goal = createGoalV2({
  category: "Financial",
  statement: "Increase annual recurring revenue by 25% through new customer acquisition",
  kpis: [{
    name: "Annual Recurring Revenue",
    unit: "USD",
    target: 5000000,
    direction: "higher_is_better",
    measurement_freq: "monthly"
  }],
  priority: 1,
  time_horizon: "mid_term",
  owners: [{
    stakeholder_id: "stakeholder-uuid",
    role: "owner"
  }]
}, "user-id");

const validation = validateSMARTGoal(goal);
if (validation.valid) {
  // Save goal
}
```

### Loading Goals
```typescript
import { loadGoalsV2, getGoalsByCategory } from "@/polymet/data/goal-v2-schema";

// Load all goals for tenant
const goals = loadGoalsV2(tenantId);

// Filter by category
const financialGoals = getGoalsByCategory(tenantId, "Financial");
```

### Managing Stakeholders
```typescript
import { 
  createStakeholderV2, 
  seedDefaultStakeholders 
} from "@/polymet/data/stakeholder-v2-schema";

// Seed default stakeholders
seedDefaultStakeholders(tenantId);

// Create custom stakeholder
const stakeholder = createStakeholderV2({
  name: "Jane Smith",
  email: "jane@company.com",
  group: "CFO & Finance",
  type: "individual"
});
```

## UI Integration

### Sidebar Navigation
Goals & Objectives is a **mandatory** top-level navigation item in the Retina sidebar:
- Cannot be hidden or disabled
- Always visible to all users
- Located in the "Core" section
- Route: `/retina/goals`

### Page Features
The Goals page provides:
- **Goal List**: Filterable by status, category, and search
- **Statistics**: Total goals, active goals, drafts, high priority
- **Goal Cards**: Detailed view with KPIs, owners, tags
- **Create/Edit Dialog**: Form with SMART validation
- **Real-time Validation**: Immediate feedback on SMART criteria

## Data Storage

Goals and stakeholders are stored in localStorage with tenant scoping:
- Goals: `retina_goals_v2_{tenantId}`
- Stakeholders: `retina_stakeholders_v2_{tenantId}`

## Validation Rules

### SMART Pre-checks
1. **Statement length ≥ 10 characters**
2. **≥ 1 KPI with target or range** (range_min & range_max)
3. **≥ 1 owner** (owner or co_owner role)
4. **Time horizon set**

### Additional Validations
- Range KPIs: `range_min < range_max`
- Email format validation for stakeholders
- Required fields: name, category, priority, time_horizon, status

## Best Practices

### Writing SMART Goals
1. **Be Specific**: Clear, unambiguous statement
2. **Make it Measurable**: Define concrete KPIs
3. **Ensure Achievability**: Assign capable owners
4. **Keep it Relevant**: Choose appropriate category
5. **Set Time Bounds**: Define clear time horizon

### KPI Design
- Use clear, descriptive names
- Specify units of measurement
- Set realistic targets or ranges
- Choose appropriate measurement frequency
- Align direction with goal intent

### Stakeholder Management
- Assign clear ownership (owner/co-owner)
- Include relevant contributors
- Document external stakeholders
- Keep contact information current

## Integration Points

### Future Enhancements
The Goals v2 system is designed to integrate with:
- **Decision Linking**: Connect decisions to goals
- **Portfolio Alignment**: Map portfolios to strategic goals
- **KPI Tracking**: Automated progress monitoring
- **Reporting**: Goal achievement dashboards
- **Notifications**: Goal milestone alerts

## API Endpoints (Future)

Planned REST API endpoints:
- `GET /api/goals` - List goals
- `POST /api/goals` - Create goal
- `GET /api/goals/:id` - Get goal details
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `GET /api/stakeholders` - List stakeholders
- `POST /api/stakeholders` - Create stakeholder

## Schema Versioning

### Version History
- **v2.0.0** (Current): Initial release with SMART validation
  - Goal schema with comprehensive fields
  - Stakeholder schema with group management
  - Built-in validation system
  - localStorage persistence

### Migration from v1
No v1 schema exists. This is the first authoritative version.

## Technical Notes

### UUID Generation
Uses `crypto.randomUUID()` for unique identifiers.

### Timestamp Format
All timestamps are Unix epoch milliseconds (`Date.now()`).

### LocalStorage Keys
- Goals: `retina_goals_v2_{tenantId}`
- Stakeholders: `retina_stakeholders_v2_{tenantId}`

### Error Handling
All data operations include try-catch blocks with console error logging.

## Support

For questions or issues with the Goals v2 system:
1. Check validation errors in the UI
2. Review SMART criteria requirements
3. Verify stakeholder assignments
4. Ensure all required fields are filled

---

**Schema Version**: 2.0.0  
**Last Updated**: 2025-01-10  
**Status**: Authoritative & Production Ready
