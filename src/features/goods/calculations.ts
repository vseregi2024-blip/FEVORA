import { minorUnitsToMoney, moneyToMinorUnits } from "../../lib/money";

export type FifoLot = { id: string; availableQuantity: number; unitCost: string };
export type FifoAllocation = { lotId: string; quantity: number; unitCost: string; totalCost: string };

export function fifoAllocate(lots: FifoLot[], quantity: number): FifoAllocation[] {
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Количество должно быть больше нуля.");
  let remaining = quantity;
  const allocations: FifoAllocation[] = [];
  for (const lot of lots) {
    if (remaining === 0) break;
    const allocated = Math.min(lot.availableQuantity, remaining);
    if (!allocated) continue;
    const cost = moneyToMinorUnits(lot.unitCost) * BigInt(allocated);
    allocations.push({ lotId: lot.id, quantity: allocated, unitCost: lot.unitCost, totalCost: minorUnitsToMoney(cost) });
    remaining -= allocated;
  }
  if (remaining) throw new Error("Недостаточно товара на складе.");
  return allocations;
}

export function allocationCost(allocations: Array<{ totalCost: string }>) {
  return minorUnitsToMoney(allocations.reduce((total, allocation) => total + moneyToMinorUnits(allocation.totalCost), 0n));
}

export function tradeProfit(revenue: string, cost: string) {
  return minorUnitsToMoney(moneyToMinorUnits(revenue) - moneyToMinorUnits(cost));
}
