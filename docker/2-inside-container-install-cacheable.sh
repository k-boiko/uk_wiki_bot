#do-default

fo-fix-dir-ownership /project

cd /project && time su -c "cd /project && npm install --loglevel verbose" fo
