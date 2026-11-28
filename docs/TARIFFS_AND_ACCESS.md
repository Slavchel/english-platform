# NeoLeng: тарифы, доступ и legacyAccess

Документ-сценарий для будущего включения монетизации.  
Обновлён: 28.11.2026.

## 1. Текущий режим

Сейчас включён временный режим:

```ts
// lib/subscription/plans.ts
export const TEMPORARY_FREE_ACCESS = true;
```

Что это означает:

- все авторизованные пользователи получают эффективный тариф `FREE`;
- все уроки, программы, курсы и задания открыты;
- страница `/pricing` возвращает 404;
- кнопки покупки и апгрейда скрыты;
- лимиты остаются как у Free:
  - Speaking — 1 диалог в день;
  - AI-разборы — 1 раз в день;
  - административный bypass сохранён.

Важно: поле `User.subscriptionTier` в базе не перезаписывается. Оно может оставаться `PRO` у старых тестовых пользователей, но эффективный тариф через централизованный слой всё равно `FREE`.

## 2. Централизованный слой доступа

Главный файл:

```text
lib/subscription/access.ts
```

Основные функции:

```ts
getAccessByEmail(email, isAdmin)
```

Возвращает:

```ts
{
  authenticated: boolean;
  tier: "FREE" | "PRO" | "NEURO_TUTOR";
  baseTier: "FREE" | "PRO" | "NEURO_TUTOR";
  legacyAccess: boolean;
  fullContentAccess: boolean;
  limits: {
    aiAnalysesPerDay: number;
    speakingDialogsPerDay: number;
    lessons: number;
  };
}
```

Правила:

```text
TEMPORARY_FREE_ACCESS = true
  → tier всегда FREE, fullContentAccess всегда true

TEMPORARY_FREE_ACCESS = false
  → fullContentAccess = isAdmin || legacyAccess || isPaidTier(baseTier)
```

Ограничения Speaking/AI берутся из `PLAN_LIMITS[tier]`.

## 3. Тарифы и лимиты

Файл:

```text
lib/subscription/plans.ts
```

Текущая матрица:

| Тариф | AI-разборы/день | Speaking/день | Уроки |
|---|---:|---:|---|
| FREE | 1 | 1 | 1 (старое ограничение) |
| PRO | 5 | 3 | все |
| NEURO_TUTOR | без ограничений | без ограничений | все |

`PLAN_LIMITS` и типы тарифов сохранены. При временном бесплатном режиме эффективный тариф — Free, поэтому лимиты 1/1.

## 4. legacyAccess

`legacyAccess` — не отдельная колонка БД, а вычисляемый признак:

```ts
createdAt < MONETIZATION_LAUNCH_AT
```

Дата запуска:

```env
MONETIZATION_LAUNCH_AT=2027-01-01T00:00:00.000Z
```

Если переменная не задана, используется `2027-01-01T00:00:00.000Z`.

Смысл:

- все пользователи, созданные до официального запуска платных тарифов, навсегда сохраняют полный доступ к урокам и программам;
- новые пользователи после даты запуска получают доступ по действующему тарифу;
- legacyAccess не даёт безлимитные AI/Speaking, если тариф Free.

### Если нужен явный флаг в БД

Сейчас миграция не нужна. Если позже понадобится ручное управление, можно добавить:

```prisma
legacyAccess Boolean @default(false)
```

и учитывать его в `hasFullContentAccess()`. Это потребует отдельной согласованной миграции.

## 5. Где проверяется доступ

### Уроки

```text
app/lesson/[topic]/page.tsx
```

использует:

```ts
canOpenLesson(email, topic, isAdmin)
```

из:

```text
lib/subscription/server.ts
```

При временном режиме `canOpenLesson()` разрешает все 37 уроков.

### Speaking

```text
app/speaking/page.tsx
app/api/subscription/speaking/start/route.ts
app/api/speaking/route.ts
lib/subscription/server.ts
```

Используется эффективный Free-лимит `1`.

### AI-разборы

```text
app/api/speaking/route.ts
lib/subscription/server.ts
```

`checkAiAnalysisAllowance()` получает эффективный тариф Free и лимит `1`.

### Прогресс

Прогресс не менялся:

```text
LessonProgress
UserProgress
TestResult
```

Проверка доступа не удаляет и не перезаписывает прогресс.

## 6. Что скрыто до запуска монетизации

- `/pricing` → `notFound()`;
- ссылки «Тарифы» и «Улучшить до Pro» удалены из личного кабинета;
- в `UpgradeLimitModal` нет ссылки на покупку;
- в API Speaking больше нет `upgradeUrl: "/pricing"`;
- сообщения о лимитах нейтральные.

Сохранены для будущего:

```text
app/pricing/PricingCards.tsx
lib/pricing.ts
lib/subscription/test-access.ts
app/api/subscription/activate-pro/route.ts
PRO_PRICE_RUB
```

## 7. Сценарий внедрения тарифов

### Шаг 1. Назначить дату запуска

На сервере в `.env`:

```env
MONETIZATION_LAUNCH_AT=2027-02-01T00:00:00.000Z
```

Дата должна быть до фактического запуска оплаты, чтобы все существующие пользователи попали в legacyAccess.

### Шаг 2. Отключить временный бесплатный режим

В `lib/subscription/plans.ts`:

```ts
export const TEMPORARY_FREE_ACCESS = false;
```

После этого:

- новые пользователи получают обычные тарифные ограничения;
- legacyAccess-пользователи сохраняют полный доступ к контенту;
- `/pricing` снова начинает работать;
- лимиты PRO/Neuro снова применяются.

### Шаг 3. Вернуть продажи

Вернуть:

- ссылки на `/pricing` в аккаунте;
- кнопку выбора тарифа в `UpgradeLimitModal`;
- `upgradeUrl` в API-ответах, если он нужен клиенту;
- актуальные тексты в `PricingCards`.

Всё это сохранено в коде, нужно только раскомментировать/вернуть UI-блоки.

### Шаг 4. Подключить оплату

- СБП/платёжный провайдер;
- вебхук подтверждения платежа;
- обновление `subscriptionTier` после успешной оплаты;
- чеки по 422-ФЗ;
- возвраты;
- журнал платёжных событий.

### Шаг 5. Проверить сценарии

1. Новый пользователь после даты запуска:
   - Free;
   - доступен один урок;
   - 1 Speaking и 1 AI-разбор.
2. Пользователь до даты запуска:
   - `legacyAccess=true`;
   - все уроки/программы;
   - лимиты Free, если у него Free.
3. Оплативший PRO:
   - 5 AI;
   - 3 Speaking;
   - все уроки.
4. Администратор:
   - полный доступ;
   - существующий bypass.
5. Прогресс и результаты тестов не теряются.

## 8. Тестовые аккаунты

### test01@example.com

- администратор;
- используется для входа в `/admin`;
- удобен для проверки legacy-доступа.

### test02@example.com

- создан как новый Free-пользователь без подписки;
- `subscriptionTier = FREE`;
- счётчики Speaking/AI = 0;
- `freeLessonTopic = NULL`;
- `createdAt` — после локальной даты запуска;
- поэтому в локальной среде `legacyAccess = false`;
- при временном free-режиме всё равно имеет полный доступ к контенту;
- после отключения `TEMPORARY_FREE_ACCESS` должен получить обычные Free-ограничения.

Локальная дата запуска задана в `.env.local`:

```env
MONETIZATION_LAUNCH_AT=2026-11-28T01:00:00+07:00
```

Это сделано только локально, чтобы test02 считался новым пользователем, а test01 и старые аккаунты — legacy.

## 9. Как проверить локально

1. Запустить туннель к БД:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\db-tunnel.ps1
```

2. Запустить приложение:

```powershell
npm run dev
```

3. Открыть:

```text
http://localhost:3000/login
```

4. Ввести:

```text
test02@example.com
```

На localhost форма использует тестовый Credentials-вход. На production-домене это правило не действует: там test02 проходит обычный Resend-вход.

5. Проверить:

- пользователь вошёл;
- тариф Free;
- все уроки открыты;
- Speaking — 1 раз в день;
- AI-разбор — 1 раз в день;
- `/pricing` → 404.

## 10. Как полностью вернуть старую логику тарифов

1. `TEMPORARY_FREE_ACCESS = false`.
2. Задать `MONETIZATION_LAUNCH_AT` до даты регистрации всех пользователей, если нужно отключить legacy для всех.
3. Вернуть UI:
   - ссылки на `/pricing`;
   - кнопку Pro в `UpgradeLimitModal`;
   - `upgradeUrl` в API;
   - тексты лимитов Pro/Free.
4. Вернуть проверку одного бесплатного урока:
   - `freeLessonTopic` уже сохранён в схеме;
   - `canOpenLesson()` уже содержит fallback.
5. Оставить `PricingCards`, активацию Pro и `PLAN_LIMITS` без изменений.

## 11. Откат текущего free-режима

Минимальный откат:

```ts
TEMPORARY_FREE_ACCESS = false;
```

Затем выполнить production build и проверить:

```text
/pricing        → 200
/lesson/...     → доступ по тарифу
Speaking        → лимит тарифа
AI              → лимит тарифа
```

## 12. Важные ограничения

- Не менять JWT-сессию и Auth.js без необходимости.
- Не выполнять `prisma migrate reset`, `db push` или удаление пользователей.
- `subscriptionTier` не является единственным источником прав: все проверки должны идти через `getAccessByEmail()`/`canOpenLesson()`.
- Legacy-доступ должен оставаться вычисляемым или быть явно добавлен отдельной согласованной миграцией.
