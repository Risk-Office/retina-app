/**
 * Industry Goal Templates
 *
 * Pre-built SMART goal templates for common SMB industries
 * Each template includes strategic goals with measurable objectives
 */

export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  timeframe: string;
  metrics: string[];
  dependencies?: string[];
  stakeholders: string[];
}

export interface IndustryTemplate {
  industry: string;
  description: string;
  icon: string;
  goals: GoalTemplate[];
}

/**
 * Industry-specific goal templates for 11 common SMB sectors
 */
export const industryGoalTemplates: IndustryTemplate[] = [
  // 1. ASSISTED LIVING
  {
    industry: "Assisted Living",
    description:
      "Senior care facilities providing housing, healthcare, and daily living assistance",
    icon: "heart-pulse",
    goals: [
      {
        id: "al-resident-satisfaction",
        title: "Achieve 95% Resident Satisfaction Score",
        description:
          "Improve quality of care and resident experience through enhanced services, activities, and personalized care plans",
        category: "Quality of Care",
        timeframe: "12 months",
        metrics: [
          "Monthly satisfaction surveys",
          "Family feedback scores",
          "Resident retention rate",
        ],

        stakeholders: [
          "Director of Nursing",
          "Activities Coordinator",
          "Family Relations Manager",
        ],
      },
      {
        id: "al-staff-retention",
        title: "Reduce Staff Turnover to Below 25%",
        description:
          "Improve employee satisfaction and retention through competitive compensation, training programs, and workplace culture initiatives",
        category: "Human Resources",
        timeframe: "12 months",
        metrics: [
          "Quarterly turnover rate",
          "Employee satisfaction scores",
          "Average tenure",
        ],

        stakeholders: [
          "HR Director",
          "Facility Administrator",
          "Department Managers",
        ],
      },
      {
        id: "al-occupancy-rate",
        title: "Maintain 92% Occupancy Rate",
        description:
          "Optimize census through targeted marketing, community partnerships, and referral programs",
        category: "Business Development",
        timeframe: "12 months",
        metrics: [
          "Monthly occupancy percentage",
          "New admissions per month",
          "Referral source tracking",
        ],

        stakeholders: [
          "Marketing Director",
          "Admissions Coordinator",
          "Executive Director",
        ],
      },
      {
        id: "al-medication-safety",
        title: "Achieve Zero Medication Errors",
        description:
          "Implement enhanced medication management protocols, staff training, and technology solutions",
        category: "Safety & Compliance",
        timeframe: "6 months",
        metrics: [
          "Medication error incidents",
          "Near-miss reports",
          "Audit compliance scores",
        ],

        stakeholders: [
          "Director of Nursing",
          "Pharmacy Consultant",
          "Quality Assurance Manager",
        ],
      },
      {
        id: "al-falls-reduction",
        title: "Reduce Falls by 30%",
        description:
          "Implement fall prevention program including environmental modifications, exercise programs, and risk assessments",
        category: "Safety & Compliance",
        timeframe: "9 months",
        metrics: [
          "Monthly fall incidents",
          "Fall risk assessments completed",
          "Injury-free days",
        ],

        stakeholders: [
          "Director of Nursing",
          "Physical Therapist",
          "Maintenance Director",
        ],
      },
      {
        id: "al-revenue-growth",
        title: "Increase Revenue by 15%",
        description:
          "Grow revenue through occupancy optimization, ancillary services, and rate adjustments",
        category: "Financial",
        timeframe: "12 months",
        metrics: [
          "Monthly revenue",
          "Revenue per occupied bed",
          "Ancillary service revenue",
        ],

        stakeholders: ["Executive Director", "CFO", "Business Office Manager"],
      },
    ],
  },

  // 2. RESTAURANT
  {
    industry: "Restaurant",
    description:
      "Food service establishments including casual dining, quick service, and fine dining",
    icon: "utensils",
    goals: [
      {
        id: "rest-customer-satisfaction",
        title: "Achieve 4.5+ Star Average Rating",
        description:
          "Improve customer experience through food quality, service excellence, and ambiance enhancements",
        category: "Customer Experience",
        timeframe: "6 months",
        metrics: [
          "Online review ratings",
          "Customer feedback scores",
          "Repeat customer rate",
        ],

        stakeholders: [
          "General Manager",
          "Head Chef",
          "Front of House Manager",
        ],
      },
      {
        id: "rest-food-cost",
        title: "Reduce Food Cost to 28% of Revenue",
        description:
          "Optimize menu pricing, reduce waste, and negotiate better supplier contracts",
        category: "Financial",
        timeframe: "9 months",
        metrics: [
          "Monthly food cost percentage",
          "Waste tracking",
          "Supplier cost variance",
        ],

        stakeholders: ["Head Chef", "General Manager", "Purchasing Manager"],
      },
      {
        id: "rest-table-turnover",
        title: "Increase Table Turnover by 20%",
        description:
          "Improve operational efficiency through better reservation management, kitchen speed, and service flow",
        category: "Operations",
        timeframe: "6 months",
        metrics: [
          "Average table turnover time",
          "Covers per day",
          "Kitchen ticket times",
        ],

        stakeholders: ["General Manager", "Head Chef", "Host/Hostess Lead"],
      },
      {
        id: "rest-labor-cost",
        title: "Maintain Labor Cost at 30% of Revenue",
        description:
          "Optimize staffing levels, improve scheduling efficiency, and cross-train employees",
        category: "Financial",
        timeframe: "12 months",
        metrics: [
          "Labor cost percentage",
          "Sales per labor hour",
          "Overtime hours",
        ],

        stakeholders: ["General Manager", "Assistant Manager", "HR Manager"],
      },
      {
        id: "rest-online-orders",
        title: "Grow Online Orders to 25% of Revenue",
        description:
          "Expand digital presence, optimize delivery partnerships, and enhance online ordering experience",
        category: "Business Development",
        timeframe: "12 months",
        metrics: [
          "Online order revenue",
          "Order volume",
          "Average order value",
        ],

        stakeholders: [
          "General Manager",
          "Marketing Manager",
          "Operations Manager",
        ],
      },
    ],
  },

  // 3. RETAIL STORE
  {
    industry: "Retail Store",
    description: "Brick-and-mortar retail operations selling consumer goods",
    icon: "store",
    goals: [
      {
        id: "retail-sales-growth",
        title: "Increase Same-Store Sales by 12%",
        description:
          "Drive revenue growth through merchandising, promotions, and customer engagement strategies",
        category: "Sales",
        timeframe: "12 months",
        metrics: [
          "Monthly same-store sales",
          "Average transaction value",
          "Conversion rate",
        ],

        stakeholders: [
          "Store Manager",
          "Visual Merchandiser",
          "Sales Associates",
        ],
      },
      {
        id: "retail-inventory-turnover",
        title: "Achieve 6x Inventory Turnover Rate",
        description:
          "Optimize inventory management to reduce carrying costs and improve cash flow",
        category: "Operations",
        timeframe: "12 months",
        metrics: [
          "Inventory turnover ratio",
          "Days inventory outstanding",
          "Stockout rate",
        ],

        stakeholders: ["Store Manager", "Inventory Manager", "Buyers"],
      },
      {
        id: "retail-customer-loyalty",
        title: "Grow Loyalty Program to 5,000 Active Members",
        description:
          "Build customer retention through rewards program, personalized offers, and engagement campaigns",
        category: "Customer Experience",
        timeframe: "9 months",
        metrics: [
          "Active loyalty members",
          "Repeat purchase rate",
          "Member spend vs non-member",
        ],

        stakeholders: [
          "Store Manager",
          "Marketing Coordinator",
          "Customer Service Lead",
        ],
      },
      {
        id: "retail-shrinkage",
        title: "Reduce Shrinkage to Below 1.5%",
        description:
          "Minimize inventory loss through improved security, processes, and employee training",
        category: "Loss Prevention",
        timeframe: "12 months",
        metrics: [
          "Shrinkage percentage",
          "Incident reports",
          "Audit compliance",
        ],

        stakeholders: [
          "Store Manager",
          "Loss Prevention Specialist",
          "Operations Manager",
        ],
      },
      {
        id: "retail-omnichannel",
        title: "Launch Buy Online, Pick Up In-Store (BOPIS)",
        description:
          "Implement omnichannel capabilities to meet customer expectations and drive foot traffic",
        category: "Technology",
        timeframe: "6 months",
        metrics: [
          "BOPIS orders per week",
          "Pickup conversion rate",
          "Customer satisfaction",
        ],

        stakeholders: ["Store Manager", "IT Manager", "Operations Manager"],
      },
    ],
  },

  // 4. DENTAL PRACTICE
  {
    industry: "Dental Practice",
    description: "General and specialty dental care providers",
    icon: "tooth",
    goals: [
      {
        id: "dental-patient-retention",
        title: "Achieve 85% Patient Retention Rate",
        description:
          "Improve patient loyalty through excellent care, communication, and recall systems",
        category: "Patient Care",
        timeframe: "12 months",
        metrics: [
          "Annual retention rate",
          "Recall appointment completion",
          "Patient satisfaction scores",
        ],

        stakeholders: ["Practice Manager", "Dentists", "Hygienists"],
      },
      {
        id: "dental-new-patients",
        title: "Acquire 50 New Patients Per Month",
        description:
          "Grow patient base through marketing, referrals, and community outreach",
        category: "Business Development",
        timeframe: "12 months",
        metrics: [
          "New patient appointments",
          "Referral sources",
          "Marketing ROI",
        ],

        stakeholders: [
          "Practice Manager",
          "Marketing Coordinator",
          "Front Desk Staff",
        ],
      },
      {
        id: "dental-case-acceptance",
        title: "Increase Treatment Acceptance Rate to 75%",
        description:
          "Improve case presentation, patient education, and financing options",
        category: "Revenue",
        timeframe: "9 months",
        metrics: [
          "Treatment acceptance rate",
          "Average case value",
          "Financing utilization",
        ],

        stakeholders: ["Dentists", "Treatment Coordinator", "Practice Manager"],
      },
      {
        id: "dental-schedule-efficiency",
        title: "Reduce No-Shows to Below 5%",
        description:
          "Implement reminder systems, scheduling policies, and patient communication protocols",
        category: "Operations",
        timeframe: "6 months",
        metrics: ["No-show rate", "Cancellation rate", "Schedule utilization"],
        stakeholders: [
          "Front Desk Manager",
          "Practice Manager",
          "Office Coordinator",
        ],
      },
      {
        id: "dental-collections",
        title: "Achieve 98% Collection Rate",
        description:
          "Optimize billing processes, insurance verification, and payment policies",
        category: "Financial",
        timeframe: "12 months",
        metrics: ["Collection rate", "Days in A/R", "Write-off percentage"],
        stakeholders: [
          "Billing Manager",
          "Practice Manager",
          "Front Desk Staff",
        ],
      },
    ],
  },

  // 5. LAW FIRM
  {
    industry: "Law Firm",
    description:
      "Legal services providers including solo practitioners and small firms",
    icon: "scale",
    goals: [
      {
        id: "law-billable-hours",
        title: "Increase Billable Hours by 15%",
        description:
          "Improve attorney productivity through better time management, delegation, and case selection",
        category: "Revenue",
        timeframe: "12 months",
        metrics: [
          "Monthly billable hours",
          "Realization rate",
          "Utilization rate",
        ],

        stakeholders: ["Managing Partner", "Associates", "Practice Manager"],
      },
      {
        id: "law-client-acquisition",
        title: "Acquire 30 New Clients Per Quarter",
        description:
          "Grow client base through networking, referrals, digital marketing, and thought leadership",
        category: "Business Development",
        timeframe: "12 months",
        metrics: [
          "New client intake",
          "Lead conversion rate",
          "Referral sources",
        ],

        stakeholders: [
          "Managing Partner",
          "Marketing Director",
          "Business Development Manager",
        ],
      },
      {
        id: "law-collection-rate",
        title: "Achieve 95% Collection Rate on Billed Services",
        description:
          "Improve billing practices, client communication, and payment terms",
        category: "Financial",
        timeframe: "9 months",
        metrics: [
          "Collection rate",
          "Days sales outstanding",
          "Write-off percentage",
        ],

        stakeholders: [
          "Billing Manager",
          "Managing Partner",
          "Accounting Staff",
        ],
      },
      {
        id: "law-client-satisfaction",
        title: "Maintain 90% Client Satisfaction Score",
        description:
          "Deliver exceptional service through communication, responsiveness, and results",
        category: "Client Relations",
        timeframe: "12 months",
        metrics: [
          "Client satisfaction surveys",
          "Referral rate",
          "Online reviews",
        ],

        stakeholders: [
          "Managing Partner",
          "Associates",
          "Client Relations Manager",
        ],
      },
      {
        id: "law-case-management",
        title: "Implement Digital Case Management System",
        description:
          "Modernize operations with technology to improve efficiency and client service",
        category: "Technology",
        timeframe: "6 months",
        metrics: [
          "System adoption rate",
          "Time saved per case",
          "Client portal usage",
        ],

        stakeholders: ["Managing Partner", "IT Consultant", "Practice Manager"],
      },
    ],
  },

  // 6. ACCOUNTING FIRM
  {
    industry: "Accounting Firm",
    description: "Professional accounting, tax, and advisory services",
    icon: "calculator",
    goals: [
      {
        id: "acct-revenue-per-client",
        title: "Increase Revenue Per Client by 20%",
        description:
          "Expand service offerings and cross-sell advisory services to existing clients",
        category: "Revenue",
        timeframe: "12 months",
        metrics: [
          "Average revenue per client",
          "Service mix",
          "Cross-sell rate",
        ],

        stakeholders: [
          "Managing Partner",
          "Client Service Managers",
          "Advisory Team",
        ],
      },
      {
        id: "acct-client-retention",
        title: "Achieve 95% Client Retention Rate",
        description:
          "Deliver exceptional service and proactive communication to maintain long-term relationships",
        category: "Client Relations",
        timeframe: "12 months",
        metrics: [
          "Annual retention rate",
          "Client satisfaction scores",
          "Referral rate",
        ],

        stakeholders: [
          "Managing Partner",
          "Client Service Managers",
          "All Staff",
        ],
      },
      {
        id: "acct-automation",
        title: "Automate 40% of Routine Tasks",
        description:
          "Implement technology solutions to improve efficiency and reduce manual work",
        category: "Technology",
        timeframe: "9 months",
        metrics: [
          "Hours saved per month",
          "Error rate reduction",
          "Staff productivity",
        ],

        stakeholders: ["Managing Partner", "IT Manager", "Operations Manager"],
      },
      {
        id: "acct-advisory-revenue",
        title: "Grow Advisory Services to 30% of Revenue",
        description:
          "Shift from compliance to advisory services for higher margins and client value",
        category: "Business Development",
        timeframe: "18 months",
        metrics: [
          "Advisory revenue percentage",
          "New advisory engagements",
          "Margin improvement",
        ],

        stakeholders: [
          "Managing Partner",
          "Advisory Team Lead",
          "Business Development",
        ],
      },
      {
        id: "acct-staff-development",
        title: "Achieve 100% CPE Compliance",
        description:
          "Invest in staff development through training, certifications, and continuing education",
        category: "Human Resources",
        timeframe: "12 months",
        metrics: [
          "CPE hours completed",
          "Certifications earned",
          "Training satisfaction",
        ],

        stakeholders: [
          "Managing Partner",
          "HR Manager",
          "All Professional Staff",
        ],
      },
    ],
  },

  // 7. FITNESS CENTER / GYM
  {
    industry: "Fitness Center",
    description: "Gyms, fitness studios, and wellness centers",
    icon: "dumbbell",
    goals: [
      {
        id: "gym-membership-growth",
        title: "Grow Active Memberships to 800 Members",
        description:
          "Increase membership base through marketing, referrals, and community engagement",
        category: "Business Development",
        timeframe: "12 months",
        metrics: [
          "Active memberships",
          "New member sign-ups",
          "Member acquisition cost",
        ],

        stakeholders: [
          "General Manager",
          "Sales Manager",
          "Marketing Coordinator",
        ],
      },
      {
        id: "gym-retention-rate",
        title: "Achieve 85% Annual Retention Rate",
        description:
          "Improve member experience through programming, engagement, and customer service",
        category: "Member Experience",
        timeframe: "12 months",
        metrics: [
          "Annual retention rate",
          "Average membership length",
          "Cancellation reasons",
        ],

        stakeholders: [
          "General Manager",
          "Member Services Manager",
          "Fitness Director",
        ],
      },
      {
        id: "gym-personal-training",
        title: "Increase Personal Training Revenue by 30%",
        description:
          "Grow high-margin personal training services through sales, marketing, and trainer development",
        category: "Revenue",
        timeframe: "9 months",
        metrics: [
          "PT revenue",
          "Sessions per week",
          "Trainer utilization rate",
        ],

        stakeholders: [
          "Fitness Director",
          "Personal Training Manager",
          "Sales Team",
        ],
      },
      {
        id: "gym-class-attendance",
        title: "Achieve 75% Average Class Capacity",
        description:
          "Optimize class schedule, instructor quality, and member engagement",
        category: "Operations",
        timeframe: "6 months",
        metrics: [
          "Average class attendance",
          "Class capacity percentage",
          "Member satisfaction",
        ],

        stakeholders: [
          "Fitness Director",
          "Group Fitness Coordinator",
          "Instructors",
        ],
      },
      {
        id: "gym-cleanliness",
        title: "Maintain 95% Cleanliness Satisfaction Score",
        description:
          "Ensure facility cleanliness and maintenance through protocols and staff training",
        category: "Operations",
        timeframe: "12 months",
        metrics: [
          "Cleanliness survey scores",
          "Maintenance response time",
          "Inspection results",
        ],

        stakeholders: [
          "General Manager",
          "Facilities Manager",
          "Cleaning Staff",
        ],
      },
    ],
  },

  // 8. REAL ESTATE AGENCY
  {
    industry: "Real Estate Agency",
    description: "Residential and commercial real estate brokerage services",
    icon: "home",
    goals: [
      {
        id: "re-transaction-volume",
        title: "Close 120 Transactions Annually",
        description:
          "Increase sales volume through lead generation, agent productivity, and market expansion",
        category: "Sales",
        timeframe: "12 months",
        metrics: ["Closed transactions", "Transaction value", "Market share"],
        stakeholders: ["Broker/Owner", "Sales Manager", "Agents"],
      },
      {
        id: "re-agent-productivity",
        title: "Achieve $8M Average Production Per Agent",
        description:
          "Improve agent performance through training, tools, and support systems",
        category: "Operations",
        timeframe: "12 months",
        metrics: [
          "Production per agent",
          "Transactions per agent",
          "Commission per transaction",
        ],

        stakeholders: ["Broker/Owner", "Sales Manager", "Training Director"],
      },
      {
        id: "re-listing-inventory",
        title: "Maintain 40+ Active Listings",
        description:
          "Build listing inventory through prospecting, marketing, and seller relationships",
        category: "Business Development",
        timeframe: "12 months",
        metrics: [
          "Active listings",
          "Listing conversion rate",
          "Days on market",
        ],

        stakeholders: ["Broker/Owner", "Listing Agents", "Marketing Manager"],
      },
      {
        id: "re-client-satisfaction",
        title: "Achieve 95% Client Satisfaction Score",
        description:
          "Deliver exceptional service throughout the transaction process",
        category: "Client Experience",
        timeframe: "12 months",
        metrics: [
          "Client satisfaction surveys",
          "Online reviews",
          "Referral rate",
        ],

        stakeholders: ["Broker/Owner", "All Agents", "Transaction Coordinator"],
      },
      {
        id: "re-digital-presence",
        title: "Generate 200 Online Leads Per Month",
        description:
          "Build digital marketing presence through website, social media, and advertising",
        category: "Marketing",
        timeframe: "9 months",
        metrics: ["Monthly leads", "Lead conversion rate", "Website traffic"],
        stakeholders: ["Broker/Owner", "Marketing Manager", "Agents"],
      },
    ],
  },

  // 9. AUTO REPAIR SHOP
  {
    industry: "Auto Repair Shop",
    description: "Automotive service and repair facilities",
    icon: "wrench",
    goals: [
      {
        id: "auto-revenue-growth",
        title: "Increase Monthly Revenue to $100K",
        description:
          "Grow revenue through customer acquisition, service expansion, and pricing optimization",
        category: "Financial",
        timeframe: "12 months",
        metrics: ["Monthly revenue", "Average repair order", "Customer count"],
        stakeholders: ["Shop Owner", "Service Manager", "Service Advisors"],
      },
      {
        id: "auto-customer-retention",
        title: "Achieve 70% Customer Return Rate",
        description:
          "Build customer loyalty through quality work, communication, and follow-up",
        category: "Customer Experience",
        timeframe: "12 months",
        metrics: [
          "Return customer rate",
          "Customer satisfaction scores",
          "Online reviews",
        ],

        stakeholders: ["Shop Owner", "Service Manager", "All Technicians"],
      },
      {
        id: "auto-bay-utilization",
        title: "Achieve 80% Bay Utilization Rate",
        description:
          "Optimize scheduling and workflow to maximize productive capacity",
        category: "Operations",
        timeframe: "9 months",
        metrics: [
          "Bay utilization percentage",
          "Jobs per day",
          "Average job completion time",
        ],

        stakeholders: ["Service Manager", "Shop Foreman", "Technicians"],
      },
      {
        id: "auto-first-time-fix",
        title: "Achieve 95% First-Time Fix Rate",
        description:
          "Improve diagnostic accuracy and repair quality to reduce comebacks",
        category: "Quality",
        timeframe: "12 months",
        metrics: [
          "First-time fix rate",
          "Comeback percentage",
          "Warranty claims",
        ],

        stakeholders: ["Service Manager", "Lead Technician", "All Technicians"],
      },
      {
        id: "auto-technician-efficiency",
        title: "Achieve 90% Technician Efficiency Rate",
        description:
          "Improve technician productivity through training, tools, and workflow optimization",
        category: "Operations",
        timeframe: "12 months",
        metrics: [
          "Efficiency rate",
          "Billed hours vs clock hours",
          "Comebacks per technician",
        ],

        stakeholders: ["Service Manager", "Shop Foreman", "Technicians"],
      },
    ],
  },

  // 10. MARKETING AGENCY
  {
    industry: "Marketing Agency",
    description: "Digital and traditional marketing services providers",
    icon: "megaphone",
    goals: [
      {
        id: "mkt-client-acquisition",
        title: "Acquire 12 New Clients Annually",
        description:
          "Grow client base through networking, content marketing, and referrals",
        category: "Business Development",
        timeframe: "12 months",
        metrics: [
          "New clients signed",
          "Lead conversion rate",
          "Client acquisition cost",
        ],

        stakeholders: [
          "Agency Owner",
          "Business Development Manager",
          "Account Directors",
        ],
      },
      {
        id: "mkt-client-retention",
        title: "Achieve 90% Client Retention Rate",
        description:
          "Deliver measurable results and exceptional service to maintain long-term relationships",
        category: "Client Relations",
        timeframe: "12 months",
        metrics: [
          "Annual retention rate",
          "Client satisfaction scores",
          "Contract renewals",
        ],

        stakeholders: ["Agency Owner", "Account Directors", "All Team Members"],
      },
      {
        id: "mkt-revenue-per-client",
        title: "Increase Average Client Value to $5K/Month",
        description:
          "Expand service offerings and demonstrate ROI to grow account sizes",
        category: "Revenue",
        timeframe: "12 months",
        metrics: ["Average monthly retainer", "Service mix", "Upsell rate"],
        stakeholders: ["Agency Owner", "Account Directors", "Strategy Team"],
      },
      {
        id: "mkt-team-utilization",
        title: "Achieve 75% Billable Utilization Rate",
        description:
          "Optimize team productivity and project management for profitability",
        category: "Operations",
        timeframe: "9 months",
        metrics: [
          "Billable hours percentage",
          "Project profitability",
          "Capacity utilization",
        ],

        stakeholders: [
          "Agency Owner",
          "Operations Manager",
          "Project Managers",
        ],
      },
      {
        id: "mkt-thought-leadership",
        title: "Publish 50 Pieces of Thought Leadership Content",
        description:
          "Build agency brand and generate leads through content marketing",
        category: "Marketing",
        timeframe: "12 months",
        metrics: [
          "Content pieces published",
          "Website traffic",
          "Lead generation",
        ],

        stakeholders: ["Agency Owner", "Content Director", "Marketing Team"],
      },
    ],
  },

  // 11. HVAC COMPANY
  {
    industry: "HVAC Company",
    description: "Heating, ventilation, and air conditioning services",
    icon: "wind",
    goals: [
      {
        id: "hvac-revenue-growth",
        title: "Increase Annual Revenue by 25%",
        description:
          "Grow revenue through service agreements, installations, and market expansion",
        category: "Financial",
        timeframe: "12 months",
        metrics: ["Annual revenue", "Revenue by service type", "Market share"],
        stakeholders: ["Owner", "General Manager", "Sales Manager"],
      },
      {
        id: "hvac-service-agreements",
        title: "Grow Maintenance Agreements to 500 Active Contracts",
        description:
          "Build recurring revenue through preventive maintenance programs",
        category: "Business Development",
        timeframe: "12 months",
        metrics: [
          "Active service agreements",
          "Renewal rate",
          "Agreement revenue",
        ],

        stakeholders: ["Owner", "Service Manager", "Sales Team"],
      },
      {
        id: "hvac-first-call-resolution",
        title: "Achieve 85% First-Call Resolution Rate",
        description:
          "Improve technician training, truck stock, and diagnostic capabilities",
        category: "Operations",
        timeframe: "9 months",
        metrics: [
          "First-call resolution rate",
          "Callback percentage",
          "Customer satisfaction",
        ],

        stakeholders: ["Service Manager", "Lead Technician", "All Technicians"],
      },
      {
        id: "hvac-response-time",
        title: "Achieve 2-Hour Average Response Time",
        description:
          "Optimize scheduling, routing, and staffing for faster service",
        category: "Customer Service",
        timeframe: "6 months",
        metrics: [
          "Average response time",
          "Emergency call response",
          "On-time arrival rate",
        ],

        stakeholders: ["Service Manager", "Dispatcher", "Technicians"],
      },
      {
        id: "hvac-installation-margin",
        title: "Achieve 35% Gross Margin on Installations",
        description:
          "Improve estimating, project management, and installation efficiency",
        category: "Financial",
        timeframe: "12 months",
        metrics: [
          "Installation gross margin",
          "Job profitability",
          "Material waste",
        ],

        stakeholders: ["Owner", "Installation Manager", "Estimators"],
      },
    ],
  },
];

/**
 * Get templates for a specific industry
 */
export function getIndustryTemplates(
  industry: string
): IndustryTemplate | undefined {
  return industryGoalTemplates.find(
    (template) => template.industry.toLowerCase() === industry.toLowerCase()
  );
}

/**
 * Get all available industries
 */
export function getAvailableIndustries(): string[] {
  return industryGoalTemplates.map((template) => template.industry);
}

/**
 * Search templates by keyword
 */
export function searchTemplates(keyword: string): GoalTemplate[] {
  const lowerKeyword = keyword.toLowerCase();
  const results: GoalTemplate[] = [];

  industryGoalTemplates.forEach((industry) => {
    industry.goals.forEach((goal) => {
      if (
        goal.title.toLowerCase().includes(lowerKeyword) ||
        goal.description.toLowerCase().includes(lowerKeyword) ||
        goal.category.toLowerCase().includes(lowerKeyword)
      ) {
        results.push(goal);
      }
    });
  });

  return results;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): GoalTemplate[] {
  const results: GoalTemplate[] = [];

  industryGoalTemplates.forEach((industry) => {
    industry.goals.forEach((goal) => {
      if (goal.category.toLowerCase() === category.toLowerCase()) {
        results.push(goal);
      }
    });
  });

  return results;
}

/**
 * Convert template to GoalV2 format
 */
export function templateToGoalV2(
  template: GoalTemplate,
  tenantId: string,
  ownerId: string
): any {
  return {
    id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    title: template.title,
    description: template.description,
    category: template.category,
    status: "not-started" as const,
    priority: "medium" as const,
    startDate: Date.now(),
    targetDate:
      Date.now() + parseInt(template.timeframe) * 30 * 24 * 60 * 60 * 1000,
    progress: 0,
    owners: [{ stakeholderId: ownerId, role: "owner" as const }],
    metrics: template.metrics.map((metric, index) => ({
      id: `metric-${index}`,
      name: metric,
      target: 100,
      current: 0,
      unit: "%",
    })),
    dependencies: template.dependencies || [],
    tags: [template.category, "template"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
