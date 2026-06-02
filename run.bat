@echo off
echo ==============================================
echo Iniciando servidor AM Atelie (Python Flask)
echo ==============================================

REM Verifica se o venv existe, senao cria
if not exist "venv\Scripts\activate.bat" (
    echo Criando ambiente virtual...
    python -m venv venv
    if errorlevel 1 (
        echo Erro: O Python nao foi encontrado ou falhou ao criar o ambiente virtual.
        echo Por favor, certifique-se de ter o Python instalado e adicionado ao PATH.
        pause
        exit /b 1
    )
)

echo Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo Instalando/Atualizando dependencias...
pip install -r backend\requirements.txt

REM Se o banco ainda nao existe, roda o seed script para popular os dados
if not exist "backend\database.db" (
    echo Semeando banco de dados com produtos iniciais...
    python backend\seed.py
)

echo.
echo Iniciando o servidor...
echo Acesse http://127.0.0.1:5000 no seu navegador!
echo.
python backend\app.py
pause
