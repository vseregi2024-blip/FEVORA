import Link from "next/link";

import { ClientAnamnesisFields } from "@/components/client-anamnesis-fields";
import { ImperiaChoicePicker } from "@/components/imperia-choice-picker";
import { ImperiaClientMarksPicker } from "@/components/imperia-client-marks-picker";
import { ImperiaDateField } from "@/components/imperia-date-field";
import { AppIcon } from "@/components/ui/icons";
import { requireUser } from "@/server/auth";
import { clientMarks, clientSources, getCosmetologyClients } from "@/server/cosmetology";
import { createCosmetologyClientAction } from "../../actions";

export default async function NewClientPage() {
  const user = await requireUser();
  const clients = await getCosmetologyClients(user.id);
  const initial = (user.name?.trim().charAt(0) || user.email.trim().charAt(0) || "F").toLocaleUpperCase("ru-RU");
  return <div className="imperia-new-client">
    <header className="imperia-new-client-header">
      <Link href="/cosmetology/clients" className="imperia-new-client-back" aria-label="Вернуться к клиентам"><AppIcon name="arrow"/></Link>
      <Link href="/family" className="imperia-new-client-brand" aria-label="FEVORA IMPERIA — Дом"><img src="/icons/fevora-crown-512.png" alt=""/><span><b>FEVORA <em>IMPERIA</em></b><small>Больше, чем бизнес. Это ты.</small></span></Link>
      <span className="imperia-new-client-tools"><span className="imperia-new-client-bell" aria-label="Уведомления"><AppIcon name="bell"/><i/></span><Link href="/family/settings" className="imperia-new-client-avatar" aria-label="Открыть настройки профиля">{initial}</Link></span>
    </header>

    <h1 className="imperia-new-client-title">Новый <em>клиент</em></h1>

    <section className="imperia-new-client-photo" aria-label="Карточка клиента">
      <span className="imperia-new-client-photo-icon"><AppIcon name="add"/></span>
      <i><AppIcon name="add"/>Карточка клиента</i>
    </section>

    <form action={createCosmetologyClientAction} className="imperia-new-client-form">
      <section className="imperia-new-client-section">
        <label className="imperia-new-client-field imperia-new-client-field-wide"><span>Имя и фамилия <b>*</b></span><input name="fullName" required autoFocus placeholder="Например: Ирина Коваленко"/></label>
        <div className="imperia-new-client-grid">
          <label className="imperia-new-client-field"><span>Телефон <b>*</b></span><input name="phone" type="tel" required placeholder="+380…"/></label>
          <ImperiaDateField name="birthDate" label="Дата рождения" optional mode="birthDate"/>
        </div>
        <label className="imperia-new-client-field imperia-new-client-field-wide"><span>Instagram</span><input name="contactValue" type="url" placeholder="@username или ссылка"/></label>
        <input type="hidden" name="contactMethod" value="INSTAGRAM"/>
      </section>

      <section className="imperia-new-client-section imperia-new-client-status-section">
        <h2><AppIcon name="target"/>Статус и метки</h2>
        <ImperiaChoicePicker name="status" label="Статус клиента" defaultValue="NEW" options={[{ value: "NEW", label: "Новый клиент" }, { value: "REGULAR", label: "Постоянный клиент" }, { value: "VIP", label: "VIP" }, { value: "POTENTIAL", label: "Потенциальный" }, { value: "INACTIVE", label: "Не возвращается" }]}/>
        <ImperiaClientMarksPicker marks={clientMarks} selectedMarks={[]}/>
      </section>

      <section className="imperia-new-client-section">
        <h2><AppIcon name="sparkles"/>Важно</h2>
        <ImperiaChoicePicker name="source" label="Источник клиента" options={[{ value: "", label: "Не указан" }, ...clientSources.map((source) => ({ value: source, label: source }))]}/>
        <ImperiaChoicePicker name="referrerId" label="Кто порекомендовал" options={[{ value: "", label: "Никто / неизвестно" }, ...clients.map((client) => ({ value: client.id, label: client.displayName ?? `${client.firstName} ${client.lastName}`.trim() }))]}/>
      </section>

      <section className="imperia-new-client-section">
        <h2><AppIcon name="document"/>Заметки</h2>
        <textarea name="notes" placeholder="Предпочтения, важные договорённости и особенности общения"/>
      </section>

      <ClientAnamnesisFields/>
      <button className="button primary wide imperia-new-client-submit"><AppIcon name="document"/>Сохранить клиента</button>
    </form>
  </div>;
}
