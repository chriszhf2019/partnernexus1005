/**
 * 激励引擎 - 统一导出
 * Incentive Engine Module
 */

// Allocation Engine
export {
  generateAllocationRecommendation,
  simulateBudgetScenario,
  generateDefaultScenarios,
  CATEGORY_LABELS,
  CATEGORY_BASELINE_ROI,
  type AllocationRecommendation,
  type PolicyAllocation,
  type SimulationScenario,
  type AllocationAction,
  type IncentiveCategory,
} from './allocationEngine';

// Policy Engine
export {
  generateROIRanking,
  generateROITrends,
  calculateDetailedPolicyROI,
  type ROIRanking,
  type PolicyROIResult,
  type ROITrend,
} from './policyEngine';

// Behavior Engine
export {
  analyzeBehaviorAttribution,
  generateIncentiveActions,
  BEHAVIOR_LABELS,
  type AttributionSummary,
  type BehaviorAttribution,
  type IncentiveAction,
  type BehaviorType,
} from './behaviorEngine';
