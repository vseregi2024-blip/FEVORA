# FIRST PRODUCTION PAYMENT PREVIEW

Дата проверки: 11.09.2026
Режим: **production, read-only preview**
Результат: **READY — обязательный STOP перед POST**

## Выбранный клиент и процедура

| Поле | Фактическое значение |
|---|---|
| Клиент | Швец Надя |
| `loyaltyClientId` | `3*` (полный ID проверен сервером) |
| Процедура | чистка |
| Дата процедуры | 11.09.2026 |
| Статус процедуры | `COMPLETED` |
| Количество услуг | 1 |
| Итоговая стоимость | 1 000,00 UAH |
| Фактически оплачено | 1 000,00 UAH |
| Способ оплаты | Наличные |
| Финансовое движение | `CASH / DEBT_PAYMENT / 1 000,00 UAH` |
| Текущий loyalty delivery | `NOT_SENT` |
| Попыток отправки | 0 |
| `remotePaymentId` | отсутствует |
| `sentAt` | отсутствует |
| Текущий bonus balance Bot Client | 100 бонусов |
| Pending bonus balance | 0 |
| Уровень | Bronze |
| Процент начисления | 1% |

## Проверка суммы

```text
paymentAmount       = 1 000,00 UAH
paidAmount          = 1 000,00 UAH
delivery.amount     = 1 000,00 UAH
payload.amount      = 1 000,00 UAH
```

Все четыре значения совпадают. В payload используется фактически оплаченная сумма, а не плановая цена, себестоимость или прибыль.

## Payload preview

Ниже приведён точный объект, который FEVORA сформирует для Bot Client. Он только рассчитан и показан; HTTP POST не выполнялся.

```json
{
  "external_source": "FEVORA",
  "external_event_id": "fevora:appointment:cmtwk2glz0005pl4xaht37vtp:final",
  "loyalty_client_id": 39,
  "appointment_id": "cmtwk2glz0005pl4xaht37vtp",
  "amount": 1000,
  "currency": "UAH",
  "payment_date": "2026-09-11T00:00:00.000Z",
  "services": [
    {
      "name": "чистка",
      "amount": 1000
    }
  ],
  "comment": "FEVORA completed procedure"
}
```

## Idempotency

Стабильный ключ события:

`fevora:appointment:cmtwk2glz0005pl4xaht37vtp:final`

Он уже сохранён в `CosmetologyLoyaltyDelivery.externalEventId`, защищён DB-level UNIQUE и не изменится при возможном retry.

## Фактические проверки

- production-процедура прочитана из PostgreSQL;
- финансовое движение прочитано из PostgreSQL;
- зафиксирован один доход 1 000,00 UAH в `CASH`;
- процедура полностью оплачена;
- delivery существует в статусе `NOT_SENT`;
- `attemptCount = 0`;
- профиль клиента получен через production `GET /api/v1/clients/39/loyalty-profile`: HTTP 200;
- текущий баланс Bot Client остаётся 100;
- `total_spent` Bot Client остаётся 0;
- production-интерфейс показывает «Готово к передаче» и сообщает, что отправка отключена до отдельного подтверждения.

## Что НЕ выполнялось

- `POST /api/v1/payments` — **НЕ выполнялся**;
- payment в Bot Client — **НЕ создавался**;
- bonus transaction — **НЕ создавалась**;
- referral bonus — **НЕ создавался**;
- bonus balance — **не изменился**;
- кнопка отправки в production недоступна;
- повторная финансовая операция FEVORA во время preview не создавалась.

## Обязательный STOP

Кандидат и payload готовы к отдельному контролируемому подтверждению.

**Payment не отправлен. Бонусы не начислены.**
**Не выполнять первый production `POST /api/v1/payments` без отдельного явного подтверждения владельца.**
