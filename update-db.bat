@echo off
setlocal

echo Applying local Prisma migrations...
npx prisma migrate dev --name update
if errorlevel 1 (
  echo.
  echo Migration failed. Database was not changed further.
  pause
  exit /b 1
)

echo Generating Prisma Client...
npx prisma generate
if errorlevel 1 (
  echo.
  echo Prisma Client generation failed.
  pause
  exit /b 1
)

echo.
echo Done. Local database is up to date.
pause
