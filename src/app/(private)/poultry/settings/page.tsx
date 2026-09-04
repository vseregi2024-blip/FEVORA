import Link from "next/link";

const settings = [
  ["/poultry/settings/categories", "💸", "Категории расходов", "Названия, иконки и порядок"],
  ["/poultry/settings/breeds", "🐔", "Породы", "Справочник пород птицы"],
  ["/poultry/settings/feed-units", "🥣", "Единицы корма", "Мешки и бытовые меры"],
  ["/poultry/settings/feed-rates", "🌾", "Нормы кормления", "Нормы по группам и датам"],
] as const;

export default function PoultrySettingsPage() {
  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Птицеводство</p><h1>Настройки</h1><p className="muted">Справочники отдельно от ежедневной работы</p></div></header>
    <div className="settings-list">{settings.map(([href, icon, title, description]) => <Link href={href} className="settings-row" key={href}><span className="settings-icon">{icon}</span><span><b>{title}</b><small>{description}</small></span><span>›</span></Link>)}</div>
  </>;
}
