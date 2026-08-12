import Link from "next/link";

const options = [
  ["Вручну", "Швидко внесіть Family-дохід або витрату.", "/family"],
  ["Текст", "Інтерфейс готовий для текстового вводу; оберіть дані вручну.", "/family"],
  ["Голос", "Підготовлено для майбутнього підключення розпізнавання.", null],
  ["Фото", "Підготовлено для майбутнього прикріплення чека.", null],
] as const;

export default function AddPage() { return <><header className="page-header"><div><p className="eyebrow">Додати</p><h1>Новий запис</h1><p className="muted">У Task №2 записи належать проєкту «Сімʼя».</p></div></header><div className="project-grid">{options.map(([title, description, href]) => href ? <Link href={href} className="project-card active" key={title}><b>{title}</b><span>{description}</span><em>Відкрити →</em></Link> : <article className="project-card" key={title}><b>{title}</b><span>{description}</span><em>Підготовлено</em></article>)}</div></>; }
