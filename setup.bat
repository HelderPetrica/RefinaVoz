@echo off
chcp 65001 >nul
color 0A
echo ===================================================
echo   RefinaVoz - Setup e Instalador Guiado Inicial
echo ===================================================
echo.

echo [1/4] Verificando dependencias do Sistema (Python e Node.js)...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado! Por favor, instale o Python 3.11 ou superior e adicione ao PATH.
    pause
    exit /b
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] NPM/Node.js nao encontrado! Por favor, instale o Node.js.
    pause
    exit /b
)
echo [OK] Python e Node.js encontrados.
echo.

echo [2/4] Configurando o Backend (Python FastAPI)...
if not exist ".venv" (
    echo Criando ambiente virtual Python (.venv)...
    python -m venv .venv
)
echo Instalando dependencias do Python (requirements.txt)...
call .venv\Scripts\activate.bat
pip install -r requirements.txt
echo.

echo [3/4] Configurando o Frontend (React / Tauri)...
cd frontend
echo Instalando dependencias do Node...
call npm install
cd ..
echo.

echo [4/4] Verificando variaveis de ambiente...
if not exist ".env" (
    echo Criando arquivo .env a partir do modelo publico...
    if exist ".env.example" (
        copy /Y ".env.example" ".env" >nul
    ) else (
        (
            echo GEMINI_API_KEYS=sua_chave_aqui
            echo USE_MOCK_LLM=false
        ) > .env
    )
    echo [AVISO] Arquivo .env criado. Nao esqueca de editar e colocar sua GEMINI_API_KEYS.
) else (
    echo [OK] Arquivo .env ja existe.
)
echo.

echo ===================================================
echo   SETUP CONCLUIDO COM SUCESSO!
echo ===================================================
echo Para iniciar a aplicacao a qualquer momento, execute:
echo - abrir_filtro_de_fala.bat
echo.
pause
