import { describe, expect, it } from "vitest";
import {
  budgetRemaining,
  budgetRemainingPct,
  budgetUsedPct,
  isBudgetExhausted,
} from "./campaign-budget";

const base = { creatorBudget: 5_000_000, creatorCost: 0, ratePer1000Views: 10_000 };

describe("campaign budget (PRD 8.4, FR-M17-06)", () => {
  it("starts full", () => {
    expect(budgetRemaining(base)).toBe(5_000_000);
    expect(budgetRemainingPct(base)).toBe(100);
    expect(budgetUsedPct(base)).toBe(0);
    expect(isBudgetExhausted(base)).toBe(false);
  });

  it("rounds the percentage down", () => {
    const input = { ...base, creatorCost: 1_234_567 };
    expect(budgetRemaining(input)).toBe(3_765_433);
    expect(budgetRemainingPct(input)).toBe(75);
    expect(budgetUsedPct(input)).toBe(24);
  });

  it("is exhausted when the rest cannot pay for 1,000 views", () => {
    expect(isBudgetExhausted({ ...base, creatorCost: 4_990_001 })).toBe(true);
    expect(isBudgetExhausted({ ...base, creatorCost: 4_990_000 })).toBe(false);
  });

  it("is exhausted when the budget is smaller than the rate", () => {
    expect(isBudgetExhausted({ ...base, creatorBudget: 5_000 })).toBe(true);
  });

  it("never reports a negative rest", () => {
    const input = { ...base, creatorCost: 6_000_000 };
    expect(budgetRemaining(input)).toBe(0);
    expect(budgetRemainingPct(input)).toBe(0);
    expect(isBudgetExhausted(input)).toBe(true);
  });

  it("treats an empty budget as 0%", () => {
    const input = { ...base, creatorBudget: 0 };
    expect(budgetRemainingPct(input)).toBe(0);
    expect(budgetUsedPct(input)).toBe(0);
  });
});
