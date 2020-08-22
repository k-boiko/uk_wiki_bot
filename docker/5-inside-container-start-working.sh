nginx -g 'daemon off;' &

[ -f /project/storage/users.json ] || echo '{"users": {}}' > /project/storage/users.json

cd /project/ && npm run start 2>&1 | tee -a /project/storage/logs.txt

#do-default
