/**
 * Goal Wizard V2 - 6-Step Goal Creation Wizard
 * 
 * A comprehensive wizard for creating SMART goals with validation,
 * dependency checking, and stakeholder management.
 */

## Overview

The Goal Wizard V2 provides a guided 6-step process for creating organizational goals
that comply with SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound).

## Architecture

### Core Components

1. **GoalWizardV2** (`@/polymet/components/goal-wizard-v2`)
   - Main wizard component with step navigation
   - Progress tracking and validation
   - Integration with goals and stakeholders hooks
   - Toast notifications for user feedback

2. **GoalFormV2** (`@/polymet/components/goal-form-v2`)
   - Form component for each wizard step
   - Step-specific UI and validation
   - SMART validation feedback
   - Dynamic KPI and owner management

3. **RetinaGoalsNew** (`@/polymet/pages/retina-goals-new`)
   - Page wrapper for the wizard
   - Handles navigation after wizard completion

### Utilities

1. **smart-validator-v2** (`@/polymet/data/smart-validator-v2`)
   - SMART criteria validation
   - Score calculation (0-100)
   - Error and warning generation
   - Improvement suggestions

2. **dependency-cycle-v2** (`@/polymet/data/dependency-cycle-v2`)
   - Cycle detection using DFS algorithm
   - Dependency validation
   - Topological sorting
   - Affected goals analysis

### Hooks

1. **useGoalsV2** (`@/polymet/data/use-goals-v2`)
   - Goals CRUD operations
   - localStorage persistence
   - Filtering and search
   - Active goals retrieval

2. **useStakeholdersV2** (`@/polymet/data/use-stakeholders-v2`)
   - Stakeholders CRUD operations
   - localStorage persistence
   - Group-based filtering
   - Default stakeholder seeding

## Wizard Steps

### Step 1: Category Selection
- Choose from 10 predefined categories
- Radio button selection with visual feedback
- Categories: Strategic, Financial, Customer, Operational, Innovation, People, Compliance, Sustainability, Quality, Growth

### Step 2: Statement & Description
- Goal statement input (10-600 characters)
- Optional description field
- **SMART Helper Card** with criteria explanations
- Real-time SMART validation with score
- Visual feedback for each SMART criterion
- Improvement suggestions

### Step 3: KPIs & Targets
- Add multiple KPIs (minimum 1 required)
- For each KPI:
  - Name (required)
  - Unit (e.g., %, $, units)
  - Direction (increase/decrease/maintain)
  - Target value OR range (min/max)
  - Measurement frequency (Daily/Weekly/Monthly/Quarterly/Annually)
- Add/remove KPIs dynamically
- Validation warnings for missing KPIs

### Step 4: Owners & Stakeholders
- Assign stakeholders with roles:
  - **Owner** (required, at least 1)
  - Co-Owner
  - Contributor
  - Consumer
- Grouped by stakeholder type (Board, C-Suite, Teams, etc.)
- Toggle role assignment per stakeholder
- Visual feedback for missing owner

### Step 5: Dependencies (Optional)
- Link to active goals only
- Two relationship types:
  - **Depends On**: This goal requires another goal first
  - **Enables**: This goal unlocks another goal
- Cycle detection prevents circular dependencies
- Visual goal cards with category and time horizon badges
- Skip if no dependencies needed

### Step 6: Review & Save
- **SMART Validation Summary**
  - Overall score (0-100)
  - Pass/fail status
  - Criteria badges (S, M, A, R, T)
  - Error and warning lists
- **Goal Summary Card**
  - Category, statement, description
  - KPIs list
  - Owners and stakeholders
  - Dependencies
- **Priority & Time Horizon Selection**
  - Priority: 1-5 (Critical to Very Low)
  - Time Horizon: Short/Mid/Long Term
- Save button disabled until validation passes

## Validation Rules

### SMART Validation

**Specific (S)**
- Statement ≥ 10 characters
- Bonus: Contains action words (increase, improve, achieve, etc.)

**Measurable (M)**
- At least 1 KPI required
- Warning if KPIs lack targets/ranges

**Achievable (A)**
- Description ≥ 20 characters (recommended)
- Provides context for feasibility

**Relevant (R)**
- Category selected
- At least 1 owner assigned

**Time-bound (T)**
- Time horizon selected (required)

### Dependency Validation

- No self-dependencies
- No duplicate dependencies (can't both depend on and enable same goal)
- No circular dependencies (DFS-based cycle detection)
- Readable error messages with cycle path

### Step-by-Step Validation

Each step validates before allowing progression:
- Step 1: Category required
- Step 2: Statement ≥ 10 characters
- Step 3: At least 1 KPI
- Step 4: At least 1 owner with "owner" role
- Step 5: No dependency cycles
- Step 6: Full SMART validation must pass

## User Flow

1. User clicks "New Goal" on `/retina/goals`
2. Navigates to `/retina/goals/new`
3. Wizard opens automatically
4. User completes 6 steps with validation at each step
5. On save:
   - Goal created via `createGoal` hook
   - Success toast notification
   - Navigates back to `/retina/goals`
6. On cancel:
   - Navigates back to `/retina/goals`

## Data Persistence

- Goals stored in localStorage: `retina_goals_v2_{tenantId}`
- Stakeholders stored in localStorage: `retina_stakeholders_v2_{tenantId}`
- Default stakeholders seeded on first load
- Simulated API delay (300ms) for realistic UX

## API Integration (Future)

The wizard is designed for easy API integration:

```typescript
// Current (localStorage)
await createGoal(goalData);

// Future (REST API)
const response = await fetch('/v2/goals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
  },
  body: JSON.stringify(goalData),
});
```

## Error Handling

- **Validation Errors**: Toast notifications with specific error messages
- **Save Errors**: Toast with retry suggestion
- **Dependency Cycles**: Readable error with cycle path
- **Missing Required Fields**: Step-level validation prevents progression

## Accessibility

- Keyboard navigation support
- ARIA labels on form controls
- Visual feedback for validation states
- Progress indicator for wizard completion
- Clear error messages

## Future Enhancements

1. **Auto-save**: Save draft goals automatically
2. **Templates**: Pre-fill wizard with goal templates
3. **Bulk Import**: Import multiple goals from CSV
4. **Goal Cloning**: Duplicate existing goals
5. **Advanced Dependencies**: Dependency strength/type
6. **KPI Tracking**: Link KPIs to data sources
7. **Approval Workflow**: Multi-step approval for goals
8. **Notifications**: Notify stakeholders on assignment

## Testing

The wizard includes comprehensive validation at each step:

```typescript
// Test SMART validation
const result = validateSMART({
  statement: "Increase revenue by 20%",
  kpis: [{ name: "Revenue", target: 20 }],
  owners: [{ stakeholderId: "1", role: "owner" }],
  timeHorizon: "Mid Term",
  category: "Financial",
});
// result.isValid === true
// result.score === 100

// Test cycle detection
const cycleResult = wouldCreateCycle(
  existingDeps,
  "goal-4",
  ["goal-3"],
  ["goal-1"]
);
// cycleResult.hasCycle === true
// cycleResult.cycle === ["goal-1", "goal-2", "goal-3", "goal-4", "goal-1"]
```

## Usage Example

```tsx
import { GoalWizardV2 } from "@/polymet/components/goal-wizard-v2";

function MyPage() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Create Goal
      </Button>
      
      <GoalWizardV2
        open={open}
        onOpenChange={setOpen}
        tenantId="demo-co"
      />
    </>
  );
}
```

## Files Created

1. `@/polymet/data/smart-validator-v2` - SMART validation utility
2. `@/polymet/data/dependency-cycle-v2` - Cycle detection utility
3. `@/polymet/data/use-goals-v2` - Goals management hook
4. `@/polymet/data/use-stakeholders-v2` - Stakeholders management hook
5. `@/polymet/components/goal-wizard-v2` - Main wizard component
6. `@/polymet/components/goal-form-v2` - Form component for each step
7. `@/polymet/pages/retina-goals-new` - Wizard page wrapper
8. `@/polymet/data/goal-wizard-v2-readme` - This documentation

## Routes

- `/retina/goals` - Goals list page (existing)
- `/retina/goals/new` - New goal wizard (new)

## Integration Points

- **Existing Goals Page**: "New Goal" button navigates to wizard
- **Tenant Context**: Wizard respects current tenant
- **Auth Store**: User ID captured for audit trail
- **Goal Schema V2**: Compatible with existing schema
- **Stakeholder Schema V2**: Compatible with existing schema
