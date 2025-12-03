# Retina Shell Application Plan

## User Request
Create a Retina shell (React + Next.js App Router, TypeScript, Tailwind, shadcn/ui) with:
- App frame with left Sidebar and top Header
- Sidebar nav groups: Dashboard, Modules, Admin
- Under Modules: i-Scan, i-Event, i-Audit, Fragile-i, i-Decide
- Active route highlighting and breadcrumbs
- Routes: /retina (Dashboard), /retina/modules (Modules index), /retina/modules/i-decide
- Style: rounded-2xl cards, soft shadows, lucide icons

## Related Files
- @/polymet/components/retina-sidebar (to create) - Left sidebar with navigation groups
- @/polymet/components/retina-header (to create) - Top header with breadcrumbs
- @/polymet/layouts/retina-layout (to create) - Main layout combining sidebar and header
- @/polymet/pages/retina-dashboard (to create) - Dashboard page with KPI placeholders
- @/polymet/pages/retina-modules-index (to create) - Modules index with grid of cards
- @/polymet/pages/retina-i-decide (to create) - i-Decide module placeholder page
- @/polymet/prototypes/retina-app (to create) - Main prototype with routing

## TODO List
- [x] Create retina-sidebar component with navigation groups
- [x] Create retina-header component with breadcrumbs
- [x] Create retina-layout combining sidebar and header
- [x] Create retina-dashboard page with KPI placeholders
- [x] Create retina-modules-index page with module cards grid
- [x] Create retina-i-decide placeholder page
- [x] Create retina-app prototype with all routes

## Important Notes
- Use lucide-react icons for all UI elements
- Apply rounded-2xl for cards with soft shadows
- Implement active route highlighting in sidebar
- Use semantic Tailwind classes for theme consistency
- Breadcrumbs should reflect current route hierarchy
- Module cards should be visually appealing with icons
  
## Plan Information
*This plan is created when the project is at iteration 0, and date 2025-10-04T15:18:46.286Z*
