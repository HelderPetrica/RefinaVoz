@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "FRONTEND_DIR=%ROOT_DIR%\frontend"
set "REQUIREMENTS_FILE=%ROOT_DIR%\requirements.txt"
set "BACKEND_STARTED=0"
set "FRONTEND_STARTED=0"
set "FRONTEND_BLOCKED=0"
set "VENV_PYTHON="
set "VCVARS_PATH="

if /I "%~1"=="__run_backend" goto :be
if /I "%~1"=="__run_frontend" goto :fe

echo ========================================================
echo        INICIANDO REFINAVOZ (AMBIENTE PROFISSIONAL SOTA)
echo ========================================================
echo.

call :rp
if errorlevel 1 goto :end

call :pydeps
if errorlevel 1 goto :end

call :fp 14201
if errorlevel 1 goto :end

:: 1. Subindo o Backend (FastAPI na porta 14201)
echo [1/2] Iniciando o Servidor Backend (FastAPI)...
echo Python selecionado: "%VENV_PYTHON%"
if defined REFINAVOZ_SKIP_START (
    echo [DRY-RUN] Backend: call "%~f0" __run_backend
    set "BACKEND_STARTED=1"
) else (
    start "RefinaVoz - Backend (Porta 14201)" cmd /k call "%~f0" __run_backend
    set "BACKEND_STARTED=1"
)

if not defined REFINAVOZ_SKIP_START (
    timeout /t 3 /nobreak >nul
)

:: 2. Configurando Ambiente de Compilacao e dependencias do frontend
echo [2/2] Validando Node.js, Cargo e ferramentas de build MSVC...

call :nd
if errorlevel 1 set "FRONTEND_BLOCKED=1"

if "!FRONTEND_BLOCKED!"=="0" (
    call :np
    if errorlevel 1 set "FRONTEND_BLOCKED=1"
)

if "!FRONTEND_BLOCKED!"=="0" (
    call :vc
    if errorlevel 1 set "FRONTEND_BLOCKED=1"
)

if "!FRONTEND_BLOCKED!"=="0" (
    call :fp 1420
    if errorlevel 1 set "FRONTEND_BLOCKED=1"
)

if "!FRONTEND_BLOCKED!"=="0" (
    echo [SUCESSO] Linker MSVC encontrado em: "!VCVARS_PATH!"
    echo Iniciando Frontend com ambiente de compilacao carregado...
    if defined REFINAVOZ_SKIP_START (
        echo [DRY-RUN] Frontend: call "%~f0" __run_frontend
        set "FRONTEND_STARTED=1"
    ) else (
        start "RefinaVoz - Frontend (Porta 1420)" cmd /k call "%~f0" __run_frontend
        set "FRONTEND_STARTED=1"
    )
)

:summary
echo.
echo ========================================================
echo Status do bootstrap:
if "%BACKEND_STARTED%"=="1" (
    echo Backend iniciado em: http://localhost:14201
) else (
    echo Backend nao foi iniciado.
)
if "%FRONTEND_STARTED%"=="1" (
    echo Frontend/Tauri iniciado a partir de: http://localhost:1420
) else (
    echo Frontend/Tauri nao foi iniciado.
    echo Corrija os pre-requisitos acima e rode o script novamente.
)
echo ========================================================
goto :end

:rp
if exist "%ROOT_DIR%\.venv\Scripts\python.exe" set "VENV_PYTHON=%ROOT_DIR%\.venv\Scripts\python.exe"
if defined VENV_PYTHON exit /b 0

echo [INFO] Ambiente virtual nao encontrado. Tentando criar ".venv" automaticamente...
where py >nul 2>nul
if not errorlevel 1 (
    py -3 -m venv "%ROOT_DIR%\.venv"
    if errorlevel 1 (
        echo [ERRO] Falha ao criar a venv com o launcher "py -3".
        exit /b 1
    )
    set "VENV_PYTHON=%ROOT_DIR%\.venv\Scripts\python.exe"
    exit /b 0
)

where python >nul 2>nul
if not errorlevel 1 (
    python -m venv "%ROOT_DIR%\.venv"
    if errorlevel 1 (
        echo [ERRO] Falha ao criar a venv com o comando "python -m venv".
        exit /b 1
    )
    set "VENV_PYTHON=%ROOT_DIR%\.venv\Scripts\python.exe"
    exit /b 0
)

echo [ERRO] Python nao encontrado para criar a venv.
echo Instale Python 3 e rode o script novamente.
exit /b 1

:pydeps
if not exist "%REQUIREMENTS_FILE%" exit /b 0

"%VENV_PYTHON%" -c "import fastapi, uvicorn, sqlmodel, httpx, pydantic_settings, dotenv, multipart; import google.genai" >nul 2>nul
if not errorlevel 1 exit /b 0

echo [INFO] Instalando dependencias Python obrigatorias...
"%VENV_PYTHON%" -m pip install -r "%REQUIREMENTS_FILE%"
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias Python do backend.
    exit /b 1
)
exit /b 0

:nd
where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado no PATH.
    echo Instale Node.js 20.19+ ou 22.12+ antes de rodar o frontend.
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERRO] NPM nao encontrado no PATH.
    echo Reinstale o Node.js com o NPM habilitado.
    exit /b 1
)

for /f %%i in ('node -p "process.versions.node"') do set "NODE_VERSION=%%i"
node -e "const [maj,min]=process.versions.node.split('.').map(Number); const ok=(maj===20&&min>=19)||(maj===22&&min>=12)||(maj>22); process.exit(ok?0:1)"
if errorlevel 1 (
    echo [ERRO] Node.js !NODE_VERSION! e incompativel com o Vite 7 deste projeto.
    echo Atualize para Node.js 20.19+ ou 22.12+.
    exit /b 1
)

where cargo >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Cargo/Rust nao encontrado no PATH.
    echo Instale Rust com rustup antes de rodar o Tauri.
    exit /b 1
)
exit /b 0

:np
if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERRO] package.json do frontend nao encontrado em "%FRONTEND_DIR%".
    exit /b 1
)

if exist "%FRONTEND_DIR%\node_modules\.bin\tauri.cmd" exit /b 0

echo [INFO] Dependencias NPM nao encontradas. Rodando "npm install"...
pushd "%FRONTEND_DIR%"
call npm install
set "NPM_INSTALL_EXIT=!ERRORLEVEL!"
popd
if not "!NPM_INSTALL_EXIT!"=="0" (
    echo [ERRO] Falha ao instalar dependencias NPM do frontend.
    exit /b 1
)
exit /b 0

:vc
set "VS_WHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
set "VCVARS_PATH="

if exist "!VS_WHERE!" (
    for /f "usebackq delims=" %%i in (`"!VS_WHERE!" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do (
        if exist "%%i\VC\Auxiliary\Build\vcvars64.bat" set "VCVARS_PATH=%%i\VC\Auxiliary\Build\vcvars64.bat"
    )
)

if not defined VCVARS_PATH (
    for %%i in (
        "%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
        "%ProgramFiles(x86)%\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
        "%ProgramFiles(x86)%\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat"
        "%ProgramFiles(x86)%\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat"
    ) do (
        if not defined VCVARS_PATH if exist %%~i set "VCVARS_PATH=%%~i"
    )
)

if defined VCVARS_PATH exit /b 0

echo [ERRO] Ferramentas C++ do Visual Studio nao encontradas.
echo Instale o workload "Desktop development with C++" no Visual Studio Build Tools 2022.
echo Sem isso o Cargo falha com "link.exe not found".
exit /b 1

:fp
set "TARGET_PORT=%~1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=%TARGET_PORT%; $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; if (-not $listeners) { exit 0 }; $ids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $ids) { try { $proc = Get-Process -Id $procId -ErrorAction Stop; Write-Host ('[INFO] Encerrando PID=' + $procId + ' (' + $proc.ProcessName + ') na porta ' + $port); Stop-Process -Id $procId -Force -ErrorAction Stop } catch { Write-Error ('Falha ao encerrar PID=' + $procId + ' na porta ' + $port); exit 1 } }"
if errorlevel 1 (
    echo [ERRO] Nao foi possivel liberar a porta %TARGET_PORT%.
    exit /b 1
)
exit /b 0

:be
if not defined VENV_PYTHON (
    call :rp
    if errorlevel 1 exit /b 1
)
cd /d "%ROOT_DIR%"
set "PYTHONPATH=%ROOT_DIR%"
"%VENV_PYTHON%" -m uvicorn backend.main:app --host 127.0.0.1 --port 14201
if errorlevel 1 pause
exit /b %ERRORLEVEL%

:fe
if not defined VCVARS_PATH (
    call :vc
    if errorlevel 1 exit /b 1
)
cd /d "%FRONTEND_DIR%"
call "%VCVARS_PATH%"
if errorlevel 1 pause & exit /b %ERRORLEVEL%
call npm run tauri dev
if errorlevel 1 pause
exit /b %ERRORLEVEL%

:end
pause