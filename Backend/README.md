# EnhServer Backend

此repo是EnhServer後端的相關code，歡迎加入[Discord群組](https://discord.gg/seJwuzCbWq)一起討論。

EnhServer設計上為前後端分離，同時因為會有CORS之類的問題，請與反向代理配合使用。

主要功能(網頁相關)皆透過`/api`存取，Socket Server透過`/socket.io`存取。

## 如何使用本專案?

1. 透過VSCode (建議測試時使用)
2. 透過Docker container部署
    - 透過docker build建置image
    - 使用docker run指令或編寫對應的docker compose檔進行部署

## 現有功能 (*v0.0.1*)

- 提供帳號機制，並可使用passkey進行登入。
- Socket Server based on socket.io
    - 傳訊功能
        - 一對一
        - 房間內廣播
        - 全體廣播
    - 房間功能
        - 可透過自訂分區代碼以分隔房間
        - 可創建、加入、離開房間
        - 列出所有房間
        - 取得房間內使用者id