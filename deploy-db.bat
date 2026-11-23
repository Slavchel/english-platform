@echo off
setlocal

echo Applying production Prisma migrations...
npx prisma migrate deploy
if errorlevel 1 (
  echo.
  echo Production migration failed. Check the logs before retrying.
  pause
  exit /b 1
)

echo.
echo Done. Production database is up to date.
pause
