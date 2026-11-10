import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateShipping, couponDiscount, isHalfMetreStep, roundMoney } from '../src/utils/pricing';
import { calculateOrderTotal } from '../src/utils/order.util';

test('shipping: Rs150 below Rs2,000, free from Rs2,000', () => {
  assert.equal(calculateShipping(0), 150);
  assert.equal(calculateShipping(1999.99), 150);
  assert.equal(calculateShipping(2000), 0);
  assert.equal(calculateShipping(15000), 0);
});

test('quantities must be in 0.5 m steps', () => {
  for (const q of [0.5, 1, 1.5, 2, 10.5]) assert.ok(isHalfMetreStep(q), String(q));
  for (const q of [0.3, 1.25, 0.75, 2.1]) assert.ok(!isHalfMetreStep(q), String(q));
});

test('percentage coupon respects maxDiscount', () => {
  assert.equal(couponDiscount(1000, { discountType: 'PERCENTAGE', discountValue: 10 }), 100);
  assert.equal(couponDiscount(5000, { discountType: 'PERCENTAGE', discountValue: 10, maxDiscount: 300 }), 300);
});

test('fixed coupon can never exceed the subtotal', () => {
  assert.equal(couponDiscount(200, { discountType: 'FIXED', discountValue: 500 }), 200);
  assert.equal(couponDiscount(1000, { discountType: 'FIXED', discountValue: -50 }), 0);
});

test('order total never goes negative and rounds to paise', () => {
  assert.equal(calculateOrderTotal(449.1, 150, 0, 0), 599.1);
  assert.equal(calculateOrderTotal(100, 0, 0, 500), 0);
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
});
