import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function DeletePoultrySaleForm({ id, action }: { id: string; action: (formData: FormData) => void | Promise<void> }) {
  return <ConfirmationDialog action={action} fieldName="id" fieldValue={id} trigger="Удалить" title="Удалить продажу?" description="Связанный доход и движение поголовья будут исключены из расчётов, а данные останутся в истории." confirmLabel="Удалить" triggerClassName="text-link" />;
}
