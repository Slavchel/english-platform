# Доступ к PostgreSQL с ПК

Production-база больше не использует Supabase.

```text
VPS:        176.124.193.47
PostgreSQL: только 127.0.0.1:5432
База:       neoleng
Пользователь: neoleng_app
```

Пароль находится в локальном `.env.local` и в `/root/neoleng-db-credentials` на VPS.

## 1. Запустить SSH-туннель

В отдельном PowerShell из папки проекта:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\db-tunnel.ps1
```

Будет открыт локальный порт `5433`:

```text
127.0.0.1:5433 → PostgreSQL VPS
```

Туннель должен оставаться запущенным.

## 2. Локальное приложение

`npm run dev` использует `.env.local`, где `DATABASE_URL` уже указывает на:

```text
127.0.0.1:5433
```

Перезапустить dev-сервер, если он был запущен до смены `.env.local`.

## 3. Prisma Studio

```powershell
npm run db:studio
```

Prisma Studio использует локальный `.env` с тем же туннельным адресом.

## 4. DBeaver / pgAdmin

```text
Host:     127.0.0.1
Port:     5433
Database: neoleng
User:     neoleng_app
Password: взять из локального .env.local или с VPS
```

Не публикуйте пароль и не добавляйте `.env`/`.env.local` в Git.

## 5. Остановить туннель

Закрыть окно PowerShell или нажать `Ctrl+C`.
