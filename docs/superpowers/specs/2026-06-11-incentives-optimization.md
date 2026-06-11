# Incentives Page Optimization Spec

**Date:** 2026-06-11  
**Scope:** `/incentives` page — data authenticity, logic fixes, code consolidation

## Phase 1: Data Authenticity (数据真实性)

### 1.1 Fix data mapping mismatch
- **Problem:** `mapProgram()` converts snake_case → camelCase, but component accesses both conventions
- **Fix:** Add snake_case aliases in `mapProgram()` for backward compatibility
- **File:** `src/services/marketing-service.ts`

### 1.2 Replace hardcoded data with real DB queries
| Hardcoded | Real Source |
|-----------|-------------|
| Top 3 partners (神州数码/东软/浪潮) | `incentive_applications` GROUP BY partner_id JOIN `partners` |
| KPI trends (↑0.3, ↑1 本季) | Compare current vs previous period |
| Pie chart (60/20/20) | `incentive_applications` by payout_type |
| Partner quadrant (48/67/82/28) | `partners` grouped by activity+contribution |
| Funnel multipliers | `incentive_applications` status pipeline |
| 成交周期 (Math.random) | Actual `submitted_at` → `approved_at` |
| 消耗节奏 "Q2 已过80%" | Calendar progress vs budget consumption |

### 1.3 Seed real database data
- Add `incentive_applications` records linked to existing partners
- Add `incentive_budget_alerts` with realistic thresholds

## Phase 2: Logic Organization (逻辑梳理)

### 2.1 Fix ROI calculation
- Current: `totalBudget / totalPayout` (inverted)
- Fixed: `(estimatedReturn - totalPayout) / totalPayout`
- Source: `deals` table linked to incentive applications

### 2.2 Progress bar (三进度条)
- Current: hardcoded 20% frozen / 70% paid
- Fixed: query `incentive_applications` by status

### 2.3 Remove `window.location.reload()`
- Replace with React state updates after edit/pause/create

### 2.4 Fix `daysRemaining` parameter
- Line 332 passes `p.start_date` instead of date elapsed calculation

### 2.5 消耗节奏 card
- Calculate real calendar progress vs real budget consumption gap

## Phase 3: Feature Optimization (功能优化)

### 3.1 Consolidate duplicate code
- Extract shared `CreateProgramModal`
- Extract shared `ProgramCard`
- Remove Policy Management's separate `loadData()`

### 3.2 Unify data flow
- Both tabs → `useMarketingData()` with shared cache

### 3.3 UX improvements
- Loading skeletons
- Empty states with CTAs
- Toast notifications
- Always-visible action buttons
