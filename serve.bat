@ECHO OFF

SET "PATH=%PATH%;bin\"

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

CD /D %~dp0

SET dateline=%date:~0,4%%date:~5,2%%date:~8,2%

IF EXIST node_modules\update.txt (
    FOR /F %%a IN (node_modules\update.txt) DO (
        IF %%a LSS %dateline% CMD /C "npm install"
    )
) else (
    IF NOT EXIST node_modules MKDIR node_modules
    CMD /C "npm install"
)

ECHO %dateline% >node_modules\update.txt

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

CALL npm start

PAUSE > NUL && EXIT
