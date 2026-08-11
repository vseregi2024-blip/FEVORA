export type BalanceTransaction = {
  amount: string;
  type: "INCOME" | "EXPENSE" | "SAVING_IN" | "SAVING_OUT" | "ADJUSTMENT";
};

const MONEY_PATTERN = /^(-?)(0|[1-9]\d*)(?:[.,](\d{1,2}))?$/;

export function moneyToMinorUnits(value: string): bigint {
  const normalized = value.trim().replace(/\s/g, "");
  const match = MONEY_PATTERN.exec(normalized);

  if (!match) {
    throw new Error("Введіть суму з точністю до копійок.");
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const whole = BigInt(match[2]);
  const fractional = (match[3] ?? "").padEnd(2, "0");
  return sign * (whole * 100n + BigInt(fractional || "0"));
}

export function minorUnitsToMoney(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100n;
  const fractional = (absolute % 100n).toString().padStart(2, "0");
  return `${sign}${whole}.${fractional}`;
}

export function calculateBalance(startingBalance: string, transactions: BalanceTransaction[]): bigint {
  return transactions.reduce((balance, transaction) => {
    const amount = moneyToMinorUnits(transaction.amount);
    switch (transaction.type) {
      case "INCOME":
      case "SAVING_OUT":
      case "ADJUSTMENT":
        return balance + amount;
      case "EXPENSE":
      case "SAVING_IN":
        return balance - amount;
    }
  }, moneyToMinorUnits(startingBalance));
}

export function formatMoney(value: string, currency = "UAH"): string {
  const [whole, fraction = "00"] = value.split(".");
  const display = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(`${whole}.${fraction}`));
  return `${display} ${currency}`;
}
