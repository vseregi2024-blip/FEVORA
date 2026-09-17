import Link from "next/link";

import { linkLoyaltyClientAction, unlinkLoyaltyClientAction } from "@/app/(private)/cosmetology/actions";
import type { LoyaltyClientSummary } from "@/features/loyalty/types";
import { formatMoney } from "@/lib/money";
import { getBonusTransactions, getClient, getLoyaltyProfile, searchClientsByPhone } from "@/server/loyalty";

const historyPageSize = 10;

const operationLabels: Record<string, string> = {
  registration_bonus: "Стартовый бонус",
  payment_bonus: "Начисление за оплату",
  referral_bonus: "Реферальный бонус",
  redeem: "Использование бонусов",
  reversal: "Корректировка бонусов",
};

function candidateName(candidate: LoyaltyClientSummary) {
  return candidate.fullName || `${candidate.firstName} ${candidate.lastName}`.trim() || "Клиент без имени";
}

function CandidateCard({ candidate, clientId }: { candidate: LoyaltyClientSummary; clientId: string }) {
  return <article className="loyalty-candidate">
    <span>
      <b>{candidateName(candidate)}</b>
      <small>{candidate.phone || "Телефон не указан"}{candidate.instagram ? ` · Instagram: ${candidate.instagram}` : ""}</small>
      <small>{candidate.telegramConnected ? "🟢 Telegram подключён" : "⚪ Telegram не подключён"}</small>
    </span>
    <details className="loyalty-confirm">
      <summary className="button primary">Подключить</summary>
      <div className="loyalty-confirm-panel">
        <b>Подключить этого клиента к программе лояльности?</b>
        <p>{candidateName(candidate)} · {candidate.phone || "без телефона"}</p>
        {candidate.instagram && <p>Instagram: {candidate.instagram}</p>}
        <div className="loyalty-actions">
          <form action={linkLoyaltyClientAction}>
            <input type="hidden" name="clientId" value={clientId}/>
            <input type="hidden" name="loyaltyClientId" value={candidate.id}/>
            <button className="button primary">Да, подключить</button>
          </form>
          <Link href={`/cosmetology/clients/${clientId}`} className="button secondary">Отмена</Link>
        </div>
      </div>
    </details>
  </article>;
}

export async function LoyaltyClientCard({
  clientId,
  loyaltyClientId,
  phone,
  searchPhone,
  errorMessage,
  historyPage = 1,
}: {
  clientId: string;
  loyaltyClientId: string | null;
  phone: string;
  searchPhone?: string;
  errorMessage?: string;
  historyPage?: number;
}) {
  if (!loyaltyClientId) {
    let candidates: LoyaltyClientSummary[] | null = null;
    let searchError = errorMessage ?? null;

    if (searchPhone) {
      try {
        candidates = await searchClientsByPhone(phone);
      } catch (error) {
        searchError = error instanceof Error ? error.message : "Не удалось выполнить поиск.";
      }
    }

    return <section className="loyalty-card">
      <header>
        <div><p className="eyebrow">Программа лояльности</p><h2>Beauty Bonus Club</h2></div>
        <span className="loyalty-status disconnected">Не подключена</span>
      </header>
      <p className="muted">Подключается только существующий клиент. Новая регистрация и бонусы не создаются.</p>

      {!searchPhone && <form method="get" className="loyalty-connect-form">
        <input type="hidden" name="loyaltySearch" value="1"/>
        <button className="button primary">Подключить</button>
      </form>}

      {searchPhone && <>
        <p className="loyalty-search-phone">Поиск по телефону из карточки: <b>{phone}</b></p>
        {searchError && <p className="loyalty-error">{searchError}</p>}
        {candidates?.length === 0 && <div className="loyalty-empty-state">
          <p>Клиент не найден в программе лояльности.</p>
          <div className="loyalty-actions">
            <Link href={`/cosmetology/clients/${clientId}?loyaltySearch=1`} className="button secondary">Попробовать снова</Link>
            <Link href={`/cosmetology/clients/${clientId}`} className="button secondary">Закрыть</Link>
          </div>
        </div>}
        {!!candidates?.length && <div className="loyalty-candidates">
          <p><b>Найден клиент программы лояльности</b></p>
          {candidates.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} clientId={clientId}/>)}
          <Link href={`/cosmetology/clients/${clientId}`} className="button secondary loyalty-cancel-search">Отмена</Link>
        </div>}
      </>}
    </section>;
  }

  const safeHistoryPage = Math.max(1, Math.min(20, Math.trunc(historyPage)));
  let profile = null;
  let loyaltyClient = null;
  let historyPages = null;
  let loadError = errorMessage ?? null;

  try {
    [profile, loyaltyClient, historyPages] = await Promise.all([
      getLoyaltyProfile(loyaltyClientId),
      getClient(loyaltyClientId),
      Promise.all(Array.from({ length: safeHistoryPage }, (_, index) => getBonusTransactions(loyaltyClientId, index + 1, historyPageSize))),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Не удалось получить данные программы лояльности.";
  }

  if (!profile || !loyaltyClient || !historyPages) return <section className="loyalty-card">
    <header><div><p className="eyebrow">Программа лояльности</p><h2>Beauty Bonus Club</h2></div><span className="loyalty-status unavailable">Недоступна</span></header>
    <p className="loyalty-error">{loadError || "Программа лояльности временно недоступна."}</p>
    <div className="loyalty-actions">
      <Link href={`/cosmetology/clients/${clientId}`} className="button secondary">Повторить</Link>
      <details className="loyalty-confirm"><summary className="button danger">Отвязать</summary><div className="loyalty-confirm-panel"><p>Удалится только связь. Клиент и бонусы останутся без изменений.</p><form action={unlinkLoyaltyClientAction}><input type="hidden" name="clientId" value={clientId}/><button className="button danger">Подтвердить отвязку</button></form></div></details>
    </div>
  </section>;

  const transactions = historyPages.flatMap((page) => page.items);
  const total = historyPages[0]?.total ?? 0;
  const hasMore = transactions.length < total;

  return <section className="loyalty-card connected">
    <header><div><p className="eyebrow">⭐ Программа лояльности</p><h2>Beauty Bonus Club</h2></div><span className="loyalty-status connected">Подключена</span></header>
    {loadError && <p className="loyalty-error">{loadError}</p>}
    <p className="loyalty-linked-client">{candidateName(loyaltyClient)}</p>
    <div className="loyalty-balance"><span>Доступно</span><strong>⭐ {new Intl.NumberFormat("ru-RU").format(profile.bonusBalance)}</strong>{profile.pendingBonusBalance > 0 && <small>⏳ {new Intl.NumberFormat("ru-RU").format(profile.pendingBonusBalance)} ожидает активации</small>}</div>
    <div className="loyalty-metrics">
      <article><span>Уровень</span><b>{profile.levelName}</b></article>
      <article><span>Начисление</span><b>{profile.levelBonusPercent}%</b></article>
      <article><span>Рефералов</span><b>{profile.totalReferrals}</b></article>
      <article><span>Всего оплачено в клубе</span><b>{formatMoney(String(profile.totalSpent))}</b></article>
    </div>
    <div className="loyalty-telegram"><span>{profile.telegramConnected ? "🟢 Telegram подключён" : "⚪ Telegram не подключён"}</span></div>

    <details id="loyalty-history" className="loyalty-history" open={safeHistoryPage > 1}>
      <summary>История бонусов</summary>
      <div>
        {transactions.map((item) => <article key={item.id}><span><b>{operationLabels[item.type] ?? item.type}</b><small>{new Date(item.createdAt).toLocaleDateString("ru-RU")} · {item.description || "Без описания"}</small></span><strong className={item.amount < 0 ? "expense" : "income"}>{item.amount > 0 ? "+" : ""}{item.amount} ⭐</strong></article>)}
        {transactions.length === 0 && <p className="empty">История бонусов пока пуста.</p>}
        {hasMore && <Link href={`/cosmetology/clients/${clientId}?loyaltyPage=${safeHistoryPage + 1}#loyalty-history`} className="button secondary loyalty-load-more">Показать ещё</Link>}
      </div>
    </details>

    <details className="loyalty-unlink"><summary>Отвязать программу лояльности</summary><div className="loyalty-confirm-panel"><p>Удалится только связь. Карточки, Telegram, бонусы и история не удаляются.</p><form action={unlinkLoyaltyClientAction}><input type="hidden" name="clientId" value={clientId}/><button className="button danger">Подтвердить отвязку</button></form></div></details>
  </section>;
}
