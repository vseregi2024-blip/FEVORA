"use client";

import { useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string; icon: string | null };
type Account = { id: string; name: string };
type Operator = "+" | "−" | "×" | "÷";
type Picker = "amount" | "category" | null;

export function QuickFamilyOperationForm({ categories, accounts, type, date, action }: { categories: Category[]; accounts: Account[]; type: "EXPENSE" | "INCOME"; date: string; action: (formData: FormData) => void | Promise<void> }) {
  const [selected, setSelected] = useState("");
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [replace, setReplace] = useState(true);
  const [picker, setPicker] = useState<Picker>(null);
  const chosenCategory = categories.find((category) => category.id === selected);
  const normalizedAmount = useMemo(() => String(Math.max(0, Number(display.replace(",", ".")) || 0).toFixed(2)), [display]);

  useEffect(() => {
    if (!picker) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setPicker(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [picker]);

  const calculate = (left: number, right: number, operation: Operator) => operation === "+" ? left + right : operation === "−" ? left - right : operation === "×" ? left * right : right === 0 ? left : left / right;
  const digit = (value: string) => { setDisplay((current) => replace || current === "0" ? value : current.length < 11 ? current + value : current); setReplace(false); };
  const decimal = () => { if (replace) { setDisplay("0,"); setReplace(false); } else if (!display.includes(",")) setDisplay(`${display},`); };
  const chooseOperator = (next: Operator) => { const current = Number(display.replace(",", ".")); if (stored !== null && operator && !replace) { const result = calculate(stored, current, operator); setStored(result); setDisplay(formatNumber(result)); } else setStored(current); setOperator(next); setReplace(true); };
  const equals = () => { if (stored === null || !operator) return; const result = Math.max(0, calculate(stored, Number(display.replace(",", ".")), operator)); setDisplay(formatNumber(result)); setStored(null); setOperator(null); setReplace(true); };
  const erase = () => { setDisplay((current) => current.length <= 1 ? "0" : current.slice(0, -1)); setReplace(false); };

  return <form action={action} className={`money-entry ${type === "EXPENSE" ? "money-entry-expense" : "money-entry-income"}`}>
    <input type="hidden" name="type" value={type}/><input type="hidden" name="amount" value={normalizedAmount}/><input type="hidden" name="categoryId" value={selected}/>
    <button type="button" className="money-entry-row money-entry-amount-row" onClick={() => setPicker("amount")}><span><small>Сумма</small><b>{Number(normalizedAmount) > 0 ? "Изменить сумму" : "Указать сумму"}</b></span><strong>{display} <em>₴</em></strong><i>›</i></button>
    <button type="button" className="money-entry-row" onClick={() => setPicker("category")}><span><small>Категория</small><b>{chosenCategory?.name ?? "Выбрать категорию"}</b></span><strong className="money-selected-icon">{chosenCategory ? categoryVisual(chosenCategory.icon, chosenCategory.name) : "•••"}</strong><i>›</i></button>
    <label className="money-account-select"><span>Счёт</span><select name="accountId" defaultValue=""><option value="">Без счёта</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
    <details className="money-entry-details"><summary>Заметка и дата <span>Сегодня</span></summary><div><label>Дата<input name="operationDate" type="date" required defaultValue={date}/></label><label>Комментарий<input name="description" maxLength={500} placeholder="Необязательно"/></label></div></details>
    <button className="money-entry-save" disabled={!selected || Number(normalizedAmount) <= 0}>Сохранить {type === "EXPENSE" ? "расход" : "доход"}</button>

    {picker === "amount" && <div className="money-picker-backdrop" onMouseDown={() => setPicker(null)}><section className="money-picker" role="dialog" aria-modal="true" aria-labelledby="amount-picker-title" onMouseDown={(event) => event.stopPropagation()}><header><button type="button" onClick={() => setPicker(null)}>Отмена</button><h2 id="amount-picker-title">Сумма</h2><button type="button" onClick={() => setPicker(null)} disabled={Number(normalizedAmount) <= 0}>Готово</button></header><div className="money-picker-amount"><strong>{display}</strong><span>₴</span><button type="button" onClick={erase} aria-label="Удалить последнюю цифру">⌫</button></div><section className="money-keypad" aria-label="Калькулятор"><button type="button" onClick={() => digit("1")}>1</button><button type="button" onClick={() => digit("2")}>2</button><button type="button" onClick={() => digit("3")}>3</button><button type="button" className={operator === "+" ? "active" : ""} onClick={() => chooseOperator("+")}>＋</button><button type="button" onClick={() => digit("4")}>4</button><button type="button" onClick={() => digit("5")}>5</button><button type="button" onClick={() => digit("6")}>6</button><button type="button" className={operator === "−" ? "active" : ""} onClick={() => chooseOperator("−")}>−</button><button type="button" onClick={() => digit("7")}>7</button><button type="button" onClick={() => digit("8")}>8</button><button type="button" onClick={() => digit("9")}>9</button><button type="button" className={operator === "×" ? "active" : ""} onClick={() => chooseOperator("×")}>×</button><button type="button" onClick={decimal}>,</button><button type="button" onClick={() => digit("0")}>0</button><button type="button" onClick={equals}>=</button><button type="button" className={operator === "÷" ? "active" : ""} onClick={() => chooseOperator("÷")}>÷</button></section></section></div>}
    {picker === "category" && <div className="money-picker-backdrop" onMouseDown={() => setPicker(null)}><section className="money-picker money-category-picker" role="dialog" aria-modal="true" aria-labelledby="category-picker-title" onMouseDown={(event) => event.stopPropagation()}><header><button type="button" onClick={() => setPicker(null)}>Отмена</button><h2 id="category-picker-title">Категория</h2><button type="button" onClick={() => setPicker(null)} disabled={!selected}>Готово</button></header><p>Выберите категорию</p><div className="money-picker-categories">{categories.map((category) => <button type="button" className={selected === category.id ? "selected" : ""} key={category.id} onClick={() => setSelected(category.id)}><span>{categoryVisual(category.icon, category.name)}</span><b>{category.name}</b>{selected === category.id && <i>✓</i>}</button>)}</div>{categories.length === 0 && <p className="empty">Категорий пока нет. Создайте их в настройках Семьи.</p>}</section></div>}
  </form>;
}

function formatNumber(value: number) { return Number.isFinite(value) ? String(Math.round(value * 100) / 100).replace(".", ",") : "0"; }
export function categoryEmoji(icon: string | null, name: string) {
  const icons: Record<string, string> = { cart: "🛒", home: "🏠", children: "🧸", health: "💊", clothes: "👕", transport: "🚗", fun: "🎭", travel: "✈️", bill: "🧾", other: "•••", income: "＋" };
  if (icon && icons[icon]) return icons[icon]; const value = name.toLocaleLowerCase("ru");
  if (/продукт|food/.test(value)) return "🛒"; if (/дом|дім|house/.test(value)) return "🏠"; if (/дет|діт/.test(value)) return "🧸"; if (/развлеч|розваг/.test(value)) return "🎭"; if (/путеш|подорож/.test(value)) return "✈️"; if (/здоров|(^|[\s/])леч|лікув/.test(value)) return "💊"; if (/одеж|одяг/.test(value)) return "👕"; if (/транспорт|авто|такси/.test(value)) return "🚗"; if (/платеж|платіж|интернет/.test(value)) return "🧾"; if (/зарплат|salary/.test(value)) return "💼"; if (/продаж/.test(value)) return "🏷️"; if (/доход|дохід/.test(value)) return "＋"; return "•••";
}
function categoryVisual(icon: string | null, name: string) { return icon?.startsWith("data:image/") ? <img className="family-custom-icon" src={icon} alt=""/> : categoryEmoji(icon, name); }
