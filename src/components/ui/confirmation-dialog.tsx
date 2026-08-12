"use client";

import { useState } from "react";

import styles from "./confirmation-dialog.module.css";

type ConfirmationDialogProps = {
  action: (formData: FormData) => void | Promise<void>;
  fieldName: string;
  fieldValue: string;
  trigger: string;
  title: string;
  description: string;
  confirmLabel: string;
  triggerClassName?: string;
};

export function ConfirmationDialog({ action, fieldName, fieldValue, trigger, title, description, confirmLabel, triggerClassName = "button danger" }: ConfirmationDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={triggerClassName} type="button" onClick={() => setOpen(true)}>{trigger}</button>
      {open && <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
        <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="confirmation-title" onMouseDown={(event) => event.stopPropagation()}>
          <p className="eyebrow">Подтвердите действие</p>
          <h2 id="confirmation-title">{title}</h2>
          <p className="muted">{description}</p>
          <form action={action} className={styles.actions}>
            <input type="hidden" name={fieldName} value={fieldValue} />
            <button className="button secondary" type="button" onClick={() => setOpen(false)}>Отмена</button>
            <button className="button danger" type="submit">{confirmLabel}</button>
          </form>
        </section>
      </div>}
    </>
  );
}
