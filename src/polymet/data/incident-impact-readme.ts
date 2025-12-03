/**
 * # Incident Impact Tracking System
 *
 * ## Overview
 * Automatically matches incidents to affected decisions via their linked signals
 * and records detailed impact history in each decision's `incident_impact[]` array.
 *
 * ## Plain-Language Label
 * **"What real problems touched this decision?"**
 *
 * ## Tooltip
 * **"Helps trace which shocks hit which choices."**
 *
 * ---
 *
 * ## Architecture
 *
 * ### Data Flow
 * ```
 * 1. Incident Created
 *    ↓
 * 2. Match to Decisions (via linked_signals)
 *    ↓
 * 3. Record Impact in decision.incident_impact[]
 *    ↓
 * 4. Log Audit Event
 *    ↓
 * 5. Display in UI
 * ```
 *
 * ### Key Components
 *
 * #### 1. Data Schema (`@/polymet/data/retina-store`)
 *
 * **IncidentImpact Interface:**
 * ```typescript
 * interface IncidentImpact {
 *   incident_id: string;
 *   incident_title: string;
 *   incident_type: "supply_failure" | "cyber_event" | "market_shock" | 
 *                   "regulatory_change" | "operational_disruption" | "other";
 *   severity: "low" | "medium" | "high" | "critical";
 *   affected_signals: string[]; // Signal IDs that were impacted
 *   impact_timestamp: number;
 *   impact_description: string; // Plain-language description
 *   estimated_effect?: {
 *     metric: string; // e.g., "EV", "VaR95", "RAROC"
 *     change_percent: number;
 *   };
 *   resolution_status: "ongoing" | "mitigated" | "resolved";
 *   resolution_date?: number;
 *   notes?: string;
 * }
 * ```
 *
 * **Decision Schema Extension:**
 * ```typescript
 * interface Decision {
 *   // ... existing fields
 *   incident_impact?: IncidentImpact[]; // Historical record of incidents
 * }
 * ```
 *
 * #### 2. Incident Matcher Service (`@/polymet/data/incident-matcher`)
 *
 * **Core Functions:**
 *
 * - `createIncident()` - Create new incident
 * - `matchIncidentToDecisions()` - Find affected decisions via signals
 * - `recordIncidentImpact()` - Create impact record
 * - `processIncidentImpact()` - Process incident and update decisions
 * - `getIncidentStats()` - Calculate statistics
 *
 * **Incident Interface:**
 * ```typescript
 * interface Incident {
 *   id: string;
 *   title: string;
 *   type: "supply_failure" | "cyber_event" | "market_shock" | 
 *         "regulatory_change" | "operational_disruption" | "other";
 *   severity: "low" | "medium" | "high" | "critical";
 *   timestamp: number;
 *   description: string;
 *   affected_signals: string[]; // Signal IDs impacted
 *   tenant_id: string;
 *   resolution_status: "ongoing" | "mitigated" | "resolved";
 *   resolution_date?: number;
 * }
 * ```
 *
 * #### 3. UI Components
 *
 * **IncidentImpactPanel** (`@/polymet/components/incident-impact-panel`)
 * - Displays incident impacts for a decision
 * - Full and compact views
 * - Plain-language descriptions
 * - Visual severity indicators
 *
 * **IncidentTrackerWidget** (`@/polymet/components/incident-tracker-widget`)
 * - Dashboard widget showing statistics
 * - Recent incidents list
 * - Full incident history dialog
 *
 * ---
 *
 * ## Usage Examples
 *
 * ### 1. Create and Process an Incident
 *
 * ```typescript
 * import { 
 *   createIncident, 
 *   processIncidentImpact 
 * } from "@/polymet/data/incident-matcher";
 * import { useRetinaStore } from "@/polymet/data/retina-store";
 *
 * function handleNewIncident() {
 *   const { getDecisionsByTenant, saveDecision, addAudit } = useRetinaStore();
 *   
 *   // Create incident
 *   const incident = createIncident({
 *     title: "Supply Chain Disruption - Port Delays",
 *     type: "supply_failure",
 *     severity: "high",
 *     timestamp: Date.now(),
 *     description: "Major port congestion causing delays",
 *     affected_signals: ["sig-supply-chain", "sig-cost-index"],
 *     tenant_id: "t-demo",
 *     resolution_status: "ongoing",
 *   });
 *   
 *   // Process incident and update affected decisions
 *   const decisions = getDecisionsByTenant("t-demo");
 *   const updatedDecisions = processIncidentImpact(
 *     incident,
 *     decisions,
 *     (eventType, payload) => addAudit(eventType, payload)
 *   );
 *   
 *   // Save updated decisions
 *   updatedDecisions.forEach((decision) => {
 *     saveDecision(decision);
 *   });
 *   
 *   console.log(`Incident affected ${updatedDecisions.length} decisions`);
 * }
 * ```
 *
 * ### 2. Display Incident Impacts in Decision View
 *
 * ```typescript
 * import { IncidentImpactPanel } from "@/polymet/components/incident-impact-panel";
 *
 * function DecisionView({ decision }) {
 *   return (
 *     <div>
 *       {/* Other decision details */}
 *       
 *       {decision.incident_impact && decision.incident_impact.length > 0 && (
 *         <IncidentImpactPanel 
 *           impacts={decision.incident_impact}
 *           compact={false}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * ### 3. Add Incident Tracker to Dashboard
 *
 * ```typescript
 * import { IncidentTrackerWidget } from "@/polymet/components/incident-tracker-widget";
 *
 * function Dashboard() {
 *   const { tenant } = useTenant();
 *   const { getDecisionsByTenant, saveDecision, addAudit } = useRetinaStore();
 *   
 *   const decisions = getDecisionsByTenant(tenant.tenantId);
 *   
 *   return (
 *     <div>
 *       <IncidentTrackerWidget
 *         tenantId={tenant.tenantId}
 *         decisions={decisions}
 *         onDecisionsUpdate={(updated) => {
 *           updated.forEach(saveDecision);
 *         }}
 *         onAuditEvent={addAudit}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * ### 4. Query Incident Data
 *
 * ```typescript
 * import {
 *   getAllIncidents,
 *   getIncidentStats,
 *   getDecisionsAffectedByIncident,
 *   getIncidentsForDecision,
 * } from "@/polymet/data/incident-matcher";
 *
 * // Get all incidents for tenant
 * const incidents = getAllIncidents("t-demo");
 *
 * // Get statistics
 * const stats = getIncidentStats("t-demo", decisions);
 * console.log(`${stats.total} incidents, ${stats.decisions_affected} decisions affected`);
 *
 * // Find decisions affected by specific incident
 * const affectedDecisions = getDecisionsAffectedByIncident("inc-001", decisions);
 *
 * // Get all incidents for a decision
 * const impacts = getIncidentsForDecision("dec-001", decisions);
 * ```
 *
 * ---
 *
 * ## Matching Logic
 *
 * ### Signal-Based Matching
 *
 * An incident affects a decision if:
 * 1. Decision has `linked_signals[]` defined
 * 2. Any signal in `decision.linked_signals[]` matches `incident.affected_signals[]`
 *
 * **Example:**
 * ```typescript
 * // Decision has linked signals
 * decision.linked_signals = [
 *   { signal_id: "sig-supply-chain", ... },
 *   { signal_id: "sig-cost-index", ... }
 * ];
 *
 * // Incident affects these signals
 * incident.affected_signals = ["sig-supply-chain", "sig-demand-score"];
 *
 * // Match found: sig-supply-chain is common
 * // Impact recorded with affected_signals: ["sig-supply-chain"]
 * ```
 *
 * ### Impact Estimation
 *
 * The system estimates impact on decision metrics based on:
 *
 * 1. **Severity Multiplier:**
 *    - Low: 2%
 *    - Medium: 5%
 *    - High: 10%
 *    - Critical: 20%
 *
 * 2. **Signal Count Multiplier:**
 *    - 3% per affected signal (max 15%)
 *
 * 3. **Metric Selection:**
 *    - Supply failure → EV
 *    - Cyber event → VaR95
 *    - Market shock → RAROC
 *    - Regulatory change → CE
 *    - Operational disruption → EV
 *
 * **Example Calculation:**
 * ```typescript
 * // High severity incident affecting 2 signals
 * severityMultiplier = 0.10;  // 10%
 * signalMultiplier = 0.06;    // 2 × 3%
 * totalImpact = 0.16;         // 16%
 *
 * // Most incidents are negative
 * estimated_effect = {
 *   metric: "EV",
 *   change_percent: -16.0
 * };
 * ```
 *
 * ---
 *
 * ## Plain-Language Descriptions
 *
 * ### Incident Type Descriptions
 * - `supply_failure` → "Supply chain disruption"
 * - `cyber_event` → "Cybersecurity incident"
 * - `market_shock` → "Market volatility event"
 * - `regulatory_change` → "Regulatory update"
 * - `operational_disruption` → "Operational issue"
 * - `other` → "External event"
 *
 * ### Severity Descriptions
 * - `low` → "minor impact"
 * - `medium` → "moderate impact"
 * - `high` → "significant impact"
 * - `critical` → "critical impact"
 *
 * ### Generated Description Format
 * ```
 * "{type_description} with {severity_description} affecting {count} linked signal(s)."
 * ```
 *
 * **Example:**
 * ```
 * "Supply chain disruption with significant impact affecting 2 linked signals."
 * ```
 *
 * ---
 *
 * ## Audit Logging
 *
 * ### Event Type: `incident.matched`
 *
 * **Payload:**
 * ```typescript
 * {
 *   incidentId: string;
 *   incidentTitle: string;
 *   incidentType: string;
 *   severity: string;
 *   decisionId: string;
 *   decisionTitle: string;
 *   affectedSignals: string[];
 *   estimatedEffect?: {
 *     metric: string;
 *     change_percent: number;
 *   };
 *   timestamp: number;
 * }
 * ```
 *
 * **Example Audit Entry:**
 * ```json
 * {
 *   "ts": 1704067200000,
 *   "tenantId": "t-demo",
 *   "actor": "System",
 *   "eventType": "incident.matched",
 *   "payload": {
 *     "incidentId": "inc-001",
 *     "incidentTitle": "Supply Chain Disruption",
 *     "incidentType": "supply_failure",
 *     "severity": "high",
 *     "decisionId": "dec-001",
 *     "decisionTitle": "Cloud Migration Strategy",
 *     "affectedSignals": ["sig-supply-chain"],
 *     "estimatedEffect": {
 *       "metric": "EV",
 *       "change_percent": -8.5
 *     },
 *     "timestamp": 1704067200000
 *   }
 * }
 * ```
 *
 * ---
 *
 * ## Integration Points
 *
 * ### 1. Dashboard Integration
 * - **Widget:** `IncidentTrackerWidget` shows statistics and recent incidents
 * - **Auto-processing:** Incidents automatically matched on dashboard load
 * - **Real-time updates:** Widget refreshes when new incidents created
 *
 * ### 2. Decision View Integration
 * - **Panel:** `IncidentImpactPanel` displays impacts for decision
 * - **Timeline:** Incidents shown in chronological order
 * - **Details:** Full impact description with affected signals
 *
 * ### 3. i-Event Module Integration
 * - **Incident creation:** Create incidents from i-Event module
 * - **Auto-matching:** Automatically match to decisions on creation
 * - **Signal mapping:** Map event signals to decision signals
 *
 * ### 4. Signal Monitor Integration
 * - **Signal updates:** Detect when incident affects signal values
 * - **Re-evaluation:** Tag decisions for re-evaluation
 * - **Impact tracking:** Link signal changes to incidents
 *
 * ---
 *
 * ## Mock Data
 *
 * ### Seeded Incidents
 *
 * The system seeds 5 mock incidents for demo purposes:
 *
 * 1. **Supply Chain Disruption - Port Delays**
 *    - Type: supply_failure
 *    - Severity: high
 *    - Signals: sig-supply-chain, sig-cost-index
 *    - Status: mitigated
 *
 * 2. **Ransomware Attack on Partner System**
 *    - Type: cyber_event
 *    - Severity: critical
 *    - Signals: sig-supply-chain, sig-demand-score
 *    - Status: resolved
 *
 * 3. **Market Volatility Spike**
 *    - Type: market_shock
 *    - Severity: medium
 *    - Signals: sig-cost-index, sig-market-volatility, sig-competitor-price
 *    - Status: ongoing
 *
 * 4. **New Compliance Requirements**
 *    - Type: regulatory_change
 *    - Severity: medium
 *    - Signals: sig-cost-index
 *    - Status: resolved
 *
 * 5. **Customer Sentiment Drop**
 *    - Type: operational_disruption
 *    - Severity: low
 *    - Signals: sig-customer-sentiment, sig-demand-score
 *    - Status: ongoing
 *
 * ---
 *
 * ## Best Practices
 *
 * ### 1. Incident Creation
 * - **Be specific:** Use descriptive titles and detailed descriptions
 * - **Map signals:** Accurately identify affected signals
 * - **Set severity:** Choose appropriate severity level
 * - **Update status:** Keep resolution status current
 *
 * ### 2. Signal Linking
 * - **Link early:** Add linked_signals to decisions during setup
 * - **Be selective:** Only link truly relevant signals
 * - **Document:** Use signal_label for clarity
 * - **Maintain:** Update links as decision evolves
 *
 * ### 3. Impact Review
 * - **Regular checks:** Review incident impacts periodically
 * - **Re-simulate:** Consider re-running simulations after major incidents
 * - **Document learnings:** Add notes to incident impacts
 * - **Track resolution:** Update status as incidents resolve
 *
 * ### 4. Performance
 * - **Batch processing:** Process multiple incidents together
 * - **Lazy loading:** Load incident details on demand
 * - **Archive old:** Archive resolved incidents after 90 days
 * - **Index signals:** Use signal IDs for fast matching
 *
 * ---
 *
 * ## Future Enhancements
 *
 * ### 1. Automatic Re-simulation
 * - Trigger simulation rerun when critical incident occurs
 * - Compare pre/post incident metrics
 * - Auto-update decision metrics
 *
 * ### 2. Incident Forecasting
 * - Predict potential incidents based on signal trends
 * - Proactive decision tagging
 * - Risk scoring
 *
 * ### 3. Impact Correlation
 * - Analyze correlation between incidents and outcomes
 * - Machine learning for impact estimation
 * - Pattern recognition
 *
 * ### 4. Notification System
 * - Real-time alerts for new incidents
 * - Email notifications for affected decisions
 * - Slack/Teams integration
 *
 * ### 5. Incident Clustering
 * - Group related incidents
 * - Identify systemic issues
 * - Root cause analysis
 *
 * ---
 *
 * ## API Reference
 *
 * ### Incident Management
 *
 * ```typescript
 * // Create incident
 * createIncident(incident: Omit<Incident, "id">): Incident
 *
 * // Get all incidents
 * getAllIncidents(tenantId?: string): Incident[]
 *
 * // Update incident status
 * updateIncidentStatus(
 *   incidentId: string,
 *   status: "ongoing" | "mitigated" | "resolved",
 *   resolutionDate?: number
 * ): void
 * ```
 *
 * ### Matching & Processing
 *
 * ```typescript
 * // Match incident to decisions
 * matchIncidentToDecisions(
 *   incident: Incident,
 *   decisions: Decision[]
 * ): Decision[]
 *
 * // Record impact on decision
 * recordIncidentImpact(
 *   decision: Decision,
 *   incident: Incident
 * ): IncidentImpact
 *
 * // Process incident and update decisions
 * processIncidentImpact(
 *   incident: Incident,
 *   decisions: Decision[],
 *   onAuditEvent?: (eventType: string, payload: any) => void
 * ): Decision[]
 * ```
 *
 * ### Queries
 *
 * ```typescript
 * // Get statistics
 * getIncidentStats(
 *   tenantId: string,
 *   decisions: Decision[]
 * ): IncidentStats
 *
 * // Get decisions affected by incident
 * getDecisionsAffectedByIncident(
 *   incidentId: string,
 *   decisions: Decision[]
 * ): Decision[]
 *
 * // Get incidents for decision
 * getIncidentsForDecision(
 *   decisionId: string,
 *   decisions: Decision[]
 * ): IncidentImpact[]
 * ```
 *
 * ### Utilities
 *
 * ```typescript
 * // Seed mock data
 * seedMockIncidents(tenantId: string): void
 * ```
 *
 * ---
 *
 * ## Summary
 *
 * The Incident Impact Tracking system provides:
 *
 * ✅ **Automatic Matching** - Incidents matched to decisions via signals
 * ✅ **Impact Recording** - Detailed history in `incident_impact[]`
 * ✅ **Plain Language** - User-friendly descriptions
 * ✅ **Visual UI** - Dashboard widget and decision panel
 * ✅ **Audit Logging** - Complete audit trail
 * ✅ **Statistics** - Comprehensive incident analytics
 * ✅ **Multi-tenant** - Full tenant isolation
 *
 * **Plain-Language Label:** "What real problems touched this decision?"
 * **Tooltip:** "Helps trace which shocks hit which choices."
 */

export const INCIDENT_IMPACT_README = "See code comments above";
