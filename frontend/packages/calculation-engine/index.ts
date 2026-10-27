import Decimal from 'decimal.js';

export function calculateDiscount(price: number | string, discountPercentage: number | string): string {
    const originalPrice = new Decimal(price);
    const percentage = new Decimal(discountPercentage).dividedBy(100);
    const discountAmount = originalPrice.times(percentage);
    return originalPrice.minus(discountAmount).toFixed(2);
}

export function calculateTax(price: number | string, taxRatePercentage: number | string): string {
    const originalPrice = new Decimal(price);
    const percentage = new Decimal(taxRatePercentage).dividedBy(100);
    return originalPrice.times(percentage).toFixed(2);
}

export function calculateTotal(price: number | string, discountPercentage: number | string, taxRatePercentage: number | string): string {
    const discountedPrice = new Decimal(calculateDiscount(price, discountPercentage));
    const taxAmount = new Decimal(calculateTax(discountedPrice.toNumber(), taxRatePercentage));
    return discountedPrice.plus(taxAmount).toFixed(2);
}
