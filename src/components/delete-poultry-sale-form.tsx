"use client";

export function DeletePoultrySaleForm({ id, action }: { id: string; action: (formData: FormData) => void | Promise<void> }) {
  return <form action={action} onSubmit={(event) => { if (!window.confirm("Удалить продажу? Связанный доход и движение поголовья будут исключены из расчётов.")) event.preventDefault(); }}><input type="hidden" name="id" value={id}/><button className="text-link">Удалить</button></form>;
}
