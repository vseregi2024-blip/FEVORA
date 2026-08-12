import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function DeleteTransactionForm({ id, action }: { id: string; action: (formData: FormData) => void | Promise<void> }) {
  return <ConfirmationDialog action={action} fieldName="id" fieldValue={id} trigger="Удалить операцию" title="Удалить операцию?" description="Запись сохранится в базе, но перестанет влиять на баланс и отчёты." confirmLabel="Удалить" />;
}
