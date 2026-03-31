// ============================================
// WALLET MATH UTILS
// ============================================
// All monetary operations use integer paise
// arithmetic to avoid floating point issues.

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Convert rupees to paise (integer) for safe math
 */
function toPaise(amount: number | Decimal): number {
    const value = amount instanceof Decimal ? amount.toNumber() : amount;
    return Math.round(value * 100);
}

/**
 * Convert paise back to Decimal rupees
 */
function toRupees(paise: number): Decimal {
    return new Decimal(paise).dividedBy(100);
}

/**
 * Add money to a balance (paise-safe)
 */
export function addMoney(balance: Decimal, amount: number): Decimal {
    const balancePaise = toPaise(balance);
    const amountPaise = toPaise(amount);
    return toRupees(balancePaise + amountPaise);
}

/**
 * Deduct money from a balance (paise-safe)
 */
export function deductMoney(balance: Decimal, amount: number): Decimal {
    const balancePaise = toPaise(balance);
    const amountPaise = toPaise(amount);
    return toRupees(balancePaise - amountPaise);
}

/**
 * Check if balance has sufficient funds for deduction
 */
export function validateBalance(balance: Decimal, amount: number): boolean {
    const balancePaise = toPaise(balance);
    const amountPaise = toPaise(amount);
    return balancePaise >= amountPaise;
}

/**
 * Ensure amount is a positive finite number
 */
export function safeAmountCalculation(amount: number): number {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Invalid amount: must be a positive finite number');
    }
    // Round to 2 decimal places to prevent floating point drift
    return Math.round(amount * 100) / 100;
}
