import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";
import { IconCircle } from "@/components/ui/imperia";

type ImperiaClient = {
  id: string;
  displayName: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  contactValue: string | null;
  contactMethod: string;
  source: string | null;
  status: string;
  specialMarks: string[];
  createdAt: Date;
};

const statusLabels: Record<string, string> = { VIP: "VIP", REGULAR: "Постоянный клиент", POTENTIAL: "Потенциальный", INACTIVE: "Не возвращается", NEW: "Новый клиент" };
const statusTones: Record<string, string> = { VIP: "vip", REGULAR: "regular", POTENTIAL: "potential", INACTIVE: "inactive", NEW: "new" };

function initials(client: ImperiaClient) {
  const name = client.displayName ?? `${client.firstName} ${client.lastName}`;
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("ru-RU") || "К";
}

export function ImperiaClients({ clients, query }: { clients: ImperiaClient[]; query: string }) {
  return <div className="imperia-clients-page">
    <form className="imperia-client-search" action="/cosmetology/clients">
      <label><AppIcon name="search"/><input name="q" type="search" inputMode="search" aria-label="Поиск клиента по имени или телефону" placeholder="Поиск клиентов, тегов, телефона…" defaultValue={query}/></label>
      <button name="filter" value="apply" type="submit" aria-label="Применить поиск"><AppIcon name="filter"/></button>
    </form>
    {query && <Link className="imperia-client-search-reset" href="/cosmetology/clients">Сбросить поиск</Link>}

    <section className="imperia-clients-total">
      <IconCircle icon="clients" tone="primary" size="large"/>
      <div><span>{query ? "Найдено клиентов" : "Всего клиентов"}</span><strong>{clients.length}</strong>{query && <small>По запросу «{query}»</small>}</div>
      <span className="imperia-clients-motto"><AppIcon name="crown"/>Люди создают<br/>большие истории</span>
    </section>

    <header className="imperia-clients-heading">
      <h1>{query ? "Результаты поиска" : "Мои клиенты"}</h1>
      <div><Link href="/cosmetology/clients" className="imperia-clients-all">Все клиенты ({clients.length}) <AppIcon name="arrow"/></Link><Link href="/cosmetology/clients/new" className="imperia-client-add" aria-label="Добавить клиента">＋</Link></div>
    </header>

    {clients.length ? <div className="imperia-client-list">{clients.map((client) => {
      const name = client.displayName ?? `${client.firstName} ${client.lastName}`.trim();
      return <article className="imperia-client-card" key={client.id}>
        <Link href={`/cosmetology/clients/${client.id}`} className="imperia-client-main" aria-label={`Открыть карточку ${name}`}>
          <span className={`imperia-client-avatar tone-${statusTones[client.status] ?? "regular"}`}>{initials(client)}</span>
          <span className="imperia-client-copy">
            <b>{name}</b>
            {client.contactValue && <small className="imperia-client-contact">{client.contactValue}</small>}
            <small><AppIcon name="phone"/>{client.phone}</small>
            <span className="imperia-client-tags"><em className={`status-${statusTones[client.status] ?? "regular"}`}>{statusLabels[client.status] ?? client.status}</em>{client.source && <em>{client.source}</em>}{client.specialMarks[0] && <em>{client.specialMarks[0]}</em>}</span>
          </span>
          <span className="imperia-client-meta"><AppIcon name="calendar"/><span><small>В базе с</small><b>{client.createdAt.toLocaleDateString("ru-RU", { month: "short", year: "numeric" })}</b></span><AppIcon name="arrow"/></span>
        </Link>
        <div className="imperia-client-actions"><Link href={`/cosmetology/clients/${client.id}`} aria-label={`Написать ${name}`}><AppIcon name="message"/></Link><Link href="/cosmetology/visits" aria-label={`Открыть календарь для ${name}`}><AppIcon name="calendar"/></Link></div>
      </article>;
    })}</div> : <section className="imperia-clients-empty"><IconCircle icon="clients" tone="pink" size="large"/><h2>{query ? "Ничего не найдено" : "Клиентов пока нет"}</h2><p>{query ? "Попробуйте другое имя, телефон или последние четыре цифры." : "Добавьте первого клиента — карточка будет готова для записей и программы лояльности."}</p><Link href={query ? "/cosmetology/clients" : "/cosmetology/clients/new"} className="imperia-gradient-button">{query ? "Сбросить поиск" : "Добавить клиента"}</Link></section>}
  </div>;
}
