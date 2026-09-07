import { z } from "zod";

import { moneyToMinorUnits } from "../../lib/money";

export const positiveMoneyInput = z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/, "Укажите корректную сумму.").refine((value) => moneyToMinorUnits(value) > 0n, "Сумма должна быть больше нуля.");
