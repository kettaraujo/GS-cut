@echo off
REM Libera a porta 8001 (servidor de dev do ChipCut) no Firewall do Windows.
REM Clique com o botao direito neste arquivo e escolha "Executar como administrador".

netsh advfirewall firewall delete rule name="ChipCut8001" >nul 2>&1
netsh advfirewall firewall add rule name="ChipCut8001" dir=in action=allow protocol=TCP localport=8001

echo.
echo ============================================================
echo  Porta 8001 liberada. Agora acesse no celular:
echo    https://10.0.1.4:8001
echo ============================================================
echo.
pause
