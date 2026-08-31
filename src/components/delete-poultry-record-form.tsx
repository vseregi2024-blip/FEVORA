import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function DeletePoultryRecordForm({ id, action, label = "Удалить" }: { id: string; action: (formData: FormData) => void | Promise<void>; label?: string }) {
  return <ConfirmationDialog action={action} fieldName="id" fieldValue={id} trigger={label} title="Удалить запись?" description="Запись останется в истории базы, но перестанет влиять на показатели Poultry." confirmLabel="Удалить" />;
}
