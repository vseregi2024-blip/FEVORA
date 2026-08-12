import Link from "next/link";

const options = [
  ["Вручну · Сімʼя", "Швидко внесіть Family-дохід або витрату.", "/family"],
  ["Вручну · Птахівництво", "Партії, корми, продажі, інкубація та витрати.", "/poultry"],
  ["Текст", "Оберіть проєкт і введіть дані вручну; автоматичного вгадування немає.", "/projects"],
  ["Голос", "Підготовлено для майбутнього підключення розпізнавання.", null],
  ["Фото", "Підготовлено для майбутнього прикріплення чека.", null],
] as const;

export default function AddPage() { return <><header className="page-header"><div><p className="eyebrow">Додати</p><h1>Новий запис</h1><p className="muted">Спочатку оберіть проєкт. FEVORA не вгадує напрям автоматично.</p></div></header><div className="project-grid">{options.map(([title, description, href]) => href ? <Link href={href} className="project-card active" key={title}><b>{title}</b><span>{description}</span><em>Відкрити →</em></Link> : <article className="project-card" key={title}><b>{title}</b><span>{description}</span><em>Підготовлено</em></article>)}</div></>; }
