export type InventoryLot = { availableQuantity: number; unitCost: number };

export function allocateLots(lots: InventoryLot[], requestedQuantity: number) {
  if (requestedQuantity <= 0) throw new Error("Количество должно быть больше нуля.");
  let remaining = requestedQuantity;
  let cost = 0;
  const allocations: Array<{ lotIndex: number; quantity: number; cost: number }> = [];
  for (const [lotIndex, lot] of lots.entries()) {
    if (remaining <= 0) break;
    const quantity = Math.min(lot.availableQuantity, remaining);
    if (quantity <= 0) continue;
    const allocationCost = quantity * lot.unitCost;
    allocations.push({ lotIndex, quantity, cost: allocationCost });
    cost += allocationCost;
    remaining -= quantity;
  }
  if (remaining > 0) throw new Error("Недостаточно остатка.");
  return { allocations, cost: roundMoney(cost) };
}

export function unitCost(totalAmount: number, quantity: number) {
  if (totalAmount < 0 || quantity <= 0) throw new Error("Некорректная закупка.");
  return totalAmount / quantity;
}

export function procedureProfit(paymentAmount: number, materialCost: number) {
  return roundMoney(paymentAmount - materialCost);
}

export function periodResult(income: number, materialCost: number, operationalExpense: number) {
  return roundMoney(income - materialCost - operationalExpense);
}

function roundMoney(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }
