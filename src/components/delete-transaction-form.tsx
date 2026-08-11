"use client";

export function DeleteTransactionForm({ id, action }: { id: string; action: (formData: FormData) => void | Promise<void> }) {
  return <form action={action} onSubmit={(event) => { if (!window.confirm("Видалити операцію? Її буде виключено з розрахунків, але запис збережеться в історії.")) event.preventDefault(); }}><input type="hidden" name="id" value={id} /><button className="button danger" type="submit">Видалити операцію</button></form>;
}
