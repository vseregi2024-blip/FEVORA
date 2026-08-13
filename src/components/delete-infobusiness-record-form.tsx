import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function DeleteInfoBusinessRecordForm({ id, action, kind }: { id: string; action: (formData: FormData) => void | Promise<void>; kind: "sale" | "expense" }) {
  const sale = kind === "sale";
  return <ConfirmationDialog action={action} fieldName="id" fieldValue={id} trigger="Удалить" title={sale ? "Удалить продажу?" : "Удалить расход?"} description={sale ? "Связанный доход будет исключён из расчётов, а запись останется в истории." : "Связанный расход будет исключён из расчётов, а запись останется в истории."} confirmLabel="Удалить" triggerClassName="text-link" />;
}
