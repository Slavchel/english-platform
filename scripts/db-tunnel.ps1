param(
    [int]$LocalPort = 5433
)

$remote = "root@176.124.193.47"
Write-Host "Opening PostgreSQL tunnel on 127.0.0.1:$LocalPort ..."
ssh -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -L "${LocalPort}:127.0.0.1:5432" $remote
