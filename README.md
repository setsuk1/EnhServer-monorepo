# EnhServer monorepo

此Repo包含了前端與後端。  
詳情請參考子資料夾中的README.md，以了解對應資訊。

摳的嘎姆部分之函式庫請參考[此處](https://code.gamelet.com/edit/EnhServer)

## 如何使用本專案?

最簡單的方法為直接透過Docker compose部署，共三步：
1. git clone https://github.com/setsuk1/EnhServer-monorepo.git
2. cd EnhServer-monorepo/Deploy
3. docker compose up -d --build

假設你想部署EnhServer於Linux，又不想下載所有的檔案，可以使用下列幾步：
1. git clone --no-checkout 此repo
2. cd EnhServer-monorepo
3. git sparse-checkout init
4. git sparse-checkout add ./docker-compose.yml
5. git checkout
6. sed -i 's/context\: \.\.\/Frontend/context\: https\:\/\/github\.com\/setsuk1\/EnhServer-monorepo.git/g' docker-compose.yml
7. sed -i 's/context\: \.\.\/Backend/context\: https\:\/\/github\.com\/setsuk1\/EnhServer-monorepo.git/g' docker-compose.yml
8. docker compose up -d --build

## 建議事項
建議使用反向代理，像是nginx/traefik/caddy實現https。
部分功能要求必須於https環境下才可使用 (ex. Passkey)。