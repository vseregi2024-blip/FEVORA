const options = [
  { value: "EXPENSE", label: "Расход" },
  { value: "INCOME", label: "Доход" },
  { value: "BOTH", label: "Общая категория" },
] as const;

export function FamilyCategoryKindPicker({ value = "EXPENSE" }: { value?: string }) {
  return <select className="family-kind-picker" name="kind" defaultValue={value} aria-label="Тип категории">
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>;
}
