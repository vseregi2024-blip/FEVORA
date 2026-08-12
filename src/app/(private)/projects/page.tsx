import Link from "next/link";

const projects: Array<{ name: string; description: string; href?: "/family" | "/poultry"; active: boolean }> = [
  { name: "Сімʼя", description: "Особисті доходи, витрати, сбереження та обовʼязкові платежі.", href: "/family", active: true },
  { name: "Косметологія", description: "Буде додано окремою задачею.", active: false },
  { name: "Птахівництво", description: "Партії, інкубація, корми, продажі та фінансовий результат.", href: "/poultry", active: true },
  { name: "Товарка", description: "Буде додано окремою задачею.", active: false },
  { name: "Інфобізнес", description: "Буде додано окремою задачею.", active: false },
];

export default function ProjectsPage() { return <><header className="page-header"><div><p className="eyebrow">Проєкти</p><h1>Ваші напрямки</h1></div></header><div className="project-grid">{projects.map((project) => project.href ? <Link className="project-card active" href={project.href} key={project.name}><b>{project.name}</b><span>{project.description}</span><em>Відкрити →</em></Link> : <article className="project-card" key={project.name}><b>{project.name}</b><span>{project.description}</span><em>Незабаром</em></article>)}</div></>; }
