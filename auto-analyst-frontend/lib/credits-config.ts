/**
 * Centralized Credit Configuration
 * 
 * This file defines all credit-related settings for different subscription plans.
 * Update credit values here to apply changes across the entire application.
 */

export type PlanType = 'TRIAL' | 'STANDARD' | 'PRO'
export type PlanName = 'Trial' | 'Standard' | 'Pro'

export interface PlanCredits {
  /** Total credits allocated per billing period */
  total: number
  /** Display name for the plan */
  displayName: string
  /** Internal plan type identifier */
  type: PlanType
  /** Whether this plan has unlimited credits */
  isUnlimited: boolean
  /** Minimum credits for plan (used for validation) */
  minimum?: number
}

export interface CreditThresholds {
  /** Threshold for considering a plan unlimited (for UI display) */
  unlimitedThreshold: number
  /** Default credits for trial users */
  defaultTrial: number
/** Warning threshold percentage (when to warn users about low credits) */
  warningThreshold: number
}

/**
 * Trial Configuration
 * Centralized place to manage trial duration and messaging
 */
export interface TrialConfig {
  /** Trial duration amount */
  duration: number
  /** Unit of time for trial ('days' | 'hours' | 'minutes' | 'weeks') */
  unit: 'days' | 'hours' | 'minutes' | 'weeks'
  /** Display string for the trial period */
  displayText: string
  /** Credits given during trial */
  credits: number
}

/**
 * Trial period configuration - Change here to update across the entire app
 */
export const TRIAL_CONFIG: TrialConfig = {
  duration: 5,
  unit: 'minutes',
  displayText: 'Analyzing!',
  credits: 500
}

/**
 * Utility class for trial management
 */
export class TrialUtils {
  /**
   * Get trial duration in milliseconds
   */
  static getTrialDurationMs(): number {
    const { duration, unit } = TRIAL_CONFIG
    
    switch (unit) {
      case 'minutes':
        return duration * 60 * 1000
      case 'hours':
        return duration * 60 * 60 * 1000
      case 'days':
        return duration * 24 * 60 * 60 * 1000
      case 'weeks':
        return duration * 7 * 24 * 60 * 60 * 1000
      default:
        return duration * 24 * 60 * 60 * 1000 // Default to days
    }
  }

  /**
   * Get trial duration in seconds (for Stripe)
   */
  static getTrialDurationSeconds(): number {
    return Math.floor(this.getTrialDurationMs() / 1000)
  }

  /**
   * Get trial end timestamp (Unix timestamp for Stripe)
   */
  static getTrialEndTimestamp(startDate?: Date): number {
    const start = startDate || new Date()
    return Math.floor((start.getTime() + this.getTrialDurationMs()) / 1000)
  }

  /**
   * Get trial end date string (ISO format)
   */
  static getTrialEndDate(startDate?: Date): string {
    const start = startDate || new Date()
    const endDate = new Date(start.getTime() + this.getTrialDurationMs())
    return endDate.toISOString()
  }

  /**
   * Get trial end date for display (YYYY-MM-DD)
   */
  static getTrialEndDateString(startDate?: Date): string {
    const start = startDate || new Date()
    const endDate = new Date(start.getTime() + this.getTrialDurationMs())
    return endDate.toISOString().split('T')[0]
  }

  /**
   * Check if trial has expired
   */
  static isTrialExpired(trialEndDate: string): boolean {
    const now = new Date()
    const endDate = new Date(trialEndDate)
    return now > endDate
  }

  /**
   * Get display text for trial period
   */
  static getTrialDisplayText(): string {
    return TRIAL_CONFIG.displayText
  }

  /**
   * Get trial credits
   */
  static getTrialCredits(): number {
    return TRIAL_CONFIG.credits
  }

  /**
   * Get human-readable duration description
   */
  static getDurationDescription(): string {
    const { duration, unit } = TRIAL_CONFIG
    const unitText = duration === 1 ? unit.slice(0, -1) : unit // Remove 's' for singular
    return `${duration} ${unitText}`
  }

  /**
   * Get trial configuration
   */
  static getTrialConfig(): TrialConfig {
    return TRIAL_CONFIG
  }
}

/**
 * Credit allocation per plan
 */
export const PLAN_CREDITS: Record<PlanName, PlanCredits> = {
  'Trial': {
    total: 500,
    displayName: 'Trial Plan',
    type: 'TRIAL',
    isUnlimited: false,
    minimum: 0
  },
  'Standard': {
    total: 500,
    displayName: 'Standard Plan', 
    type: 'STANDARD',
    isUnlimited: false,
    minimum: 0
  },
  'Pro': {
    total: 999999,
    displayName: 'Pro Plan',
    type: 'PRO',
    isUnlimited: true,
    minimum: 0
  }
}

/**
 * Credit costs for different features
 */
export const FEATURE_COSTS = {
  /** Cost for deep analysis - premium feature for paid users */
  DEEP_ANALYSIS: 50,
}

/**
 * Credit thresholds and limits
 */
export const CREDIT_THRESHOLDS: CreditThresholds = {
  unlimitedThreshold: 99999,
  defaultTrial: 500,
  warningThreshold: 80 // Warn when user has used 80% of credits
}

/**
 * Utility functions for credit management
 */
export class CreditConfig {
  /**
   * Get credit allocation for a plan by name
   */
  static getCreditsForPlan(planName: string): PlanCredits {
    // Normalize plan name to match our config keys
    const normalizedName = this.normalizePlanName(planName)
    return PLAN_CREDITS[normalizedName] || PLAN_CREDITS.Standard // Default to Standard instead of Free
  }

  /**
   * Get credit allocation by plan type
   */
  static getCreditsByType(planType: PlanType): PlanCredits {
    const plan = Object.values(PLAN_CREDITS).find(p => p.type === planType)
    return plan || PLAN_CREDITS.Standard // Default to Standard instead of Free
  }

  /**
   * Check if a plan has unlimited credits
   */
  static isUnlimitedPlan(planName: string): boolean {
    const credits = this.getCreditsForPlan(planName)
    return credits.isUnlimited || credits.total >= CREDIT_THRESHOLDS.unlimitedThreshold
  }

  /**
   * Check if credit total indicates unlimited
   */
  static isUnlimitedTotal(total: number): boolean {
    return total >= CREDIT_THRESHOLDS.unlimitedThreshold
  }

  /**
   * Get formatted display for credit total
   */
  static formatCreditTotal(total: number): string {
    if (this.isUnlimitedTotal(total)) {
      return "Unlimited"
    }
    return total.toLocaleString()
  }

  /**
   * Get formatted display for remaining credits
   */
  static formatRemainingCredits(used: number, total: number): string {
    if (this.isUnlimitedTotal(total)) {
      return "Unlimited"
    }
    const remaining = Math.max(0, total - used)
    return remaining.toLocaleString()
  }

  /**
   * Calculate usage percentage (capped at 100%)
   */
  static calculateUsagePercentage(used: number, total: number): number {
    if (this.isUnlimitedTotal(total)) {
      // For unlimited plans, show a small percentage just for UI
      return Math.min(used * 0.1, 5) // Very small percentage based on usage
    }
    return total > 0 ? Math.min(100, (used / total) * 100) : 0
  }

  /**
   * Check if user should be warned about low credits
   */
  static shouldWarnLowCredits(used: number, total: number): boolean {
    if (this.isUnlimitedTotal(total)) {
      return false
    }
    const usagePercentage = this.calculateUsagePercentage(used, total)
    return usagePercentage >= CREDIT_THRESHOLDS.warningThreshold
  }

  /**
   * Get the cost for deep analysis feature
   */
  static getDeepAnalysisCost(): number {
    return FEATURE_COSTS.DEEP_ANALYSIS
  }

  /**
   * Check if user can afford deep analysis based on their remaining credits
   */
  static canAffordDeepAnalysis(remainingCredits: number): boolean {
    return remainingCredits >= FEATURE_COSTS.DEEP_ANALYSIS
  }

  /**
   * Get the reset date one month from today (same day next month)
   */
  static getNextResetDate(): string {
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)
    return nextMonth.toISOString().split('T')[0]
  }

  /**
   * Get the reset date one year from today (same day next year)
   */
  static getNextYearlyResetDate(): string {
    const today = new Date()
    const nextYear = new Date(today)
    nextYear.setFullYear(today.getFullYear() + 1)
    return nextYear.toISOString().split('T')[0]
  }

  /**
   * Normalize plan name to match configuration keys
   */
  private static normalizePlanName(planName: string): PlanName {
    const normalized = planName.toLowerCase().trim()
    
    if (normalized.includes('trial')) {
      return 'Trial'
    }
    if (normalized.includes('standard')) {
      return 'Standard'
    }
    if (normalized.includes('pro')) {
      return 'Pro'
    }
    // Default to Standard (no more Free fallback)
    return 'Standard'
  }

  /**
   * Get all available plans
   */
  static getAllPlans(): PlanCredits[] {
    return Object.values(PLAN_CREDITS)
  }

  /**
   * Validate if a credit amount is valid for a plan
   */
  static isValidCreditAmount(amount: number, planName: string): boolean {
    const planCredits = this.getCreditsForPlan(planName)
    return amount >= (planCredits.minimum || 0) && amount <= planCredits.total
  }

  /**
   * Get the default trial credits for new users
   */
  static getDefaultTrialCredits(): number {
    return TrialUtils.getTrialCredits()
  }

  /**
   * Get trial end date (delegates to TrialUtils)
   */
  static getTrialEndDate(startDate?: Date): string {
    return TrialUtils.getTrialEndDateString(startDate)
  }

  /**
   * Check if trial has expired (delegates to TrialUtils)
   */
  static isTrialExpired(trialEndDate: string): boolean {
    return TrialUtils.isTrialExpired(trialEndDate)
  }

  /**
   * Get plan type from plan name
   */
  static getPlanType(planName: string): PlanType {
    return this.getCreditsForPlan(planName).type
  }

  /**
   * Get plan name from plan type
   */
  static getPlanName(planType: PlanType): PlanName {
    const plan = Object.entries(PLAN_CREDITS).find(([_, config]) => config.type === planType)
    return plan ? plan[0] as PlanName : 'Standard'
  }

  /**
   * Check if user has any credits remaining
   */
  static hasCreditsRemaining(used: number, total: number): boolean {
    if (this.isUnlimitedTotal(total)) {
      return true
    }
    return (total - used) > 0
  }
} 
