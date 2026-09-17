import Link from "next/link";

import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getCosmetologyCertificates } from "@/server/cosmetology";

const labels = { ACTIVE: "Активен", FULLY_USED: "Использован", EXPIRED: "Просрочен", CANCELLED: "Отменён" } as const;

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser(); const { q = "" } = await searchParams; const certificates = await getCosmetologyCertificates(user.id, q);
  return <><header className="page-header certificates-page-header"><div><p className="eyebrow">Косметология · Сертификаты</p><h1>Подарочные сертификаты</h1><p className="muted">Номинал закрывает стоимость процедуры, но не создаёт новый денежный доход при списании.</p></div><Link className="button primary" href="/cosmetology/certificates/new">＋ Новый сертификат</Link></header><form className="compact-form" method="get"><label>Поиск по номеру<input name="q" defaultValue={q} placeholder="CERT-2026-001"/></label><button className="button secondary">Найти</button></form><section className="transaction-list">{certificates.map((certificate) => <Link className="transaction-row" key={certificate.id} href={`/cosmetology/certificates/${certificate.id}`}><span><b>{certificate.certificateNumber}</b><small>{labels[certificate.status]}{certificate.expiresAt ? ` · до ${certificate.expiresAt.toLocaleDateString("ru-RU")}` : " · без срока"}{certificate.client ? ` · ${certificate.client.displayName ?? `${certificate.client.firstName} ${certificate.client.lastName}`}` : ""} · операций: {certificate._count.components}</small></span><strong className={certificate.status === "ACTIVE" ? "income" : ""}>{formatMoney(certificate.remainingAmount.toString())}</strong></Link>)}{!certificates.length && <p className="empty">Сертификатов пока нет.</p>}</section></>;
}
