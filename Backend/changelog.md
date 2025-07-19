# Changelog (EnhServer-Backend)

## v0.0.2
#### Added
- Redis Session Store
    - 將Session狀態儲存於資料庫，可避免重開Server後Session消失

- Logger
    - 提供更加優秀的輸出能力
    - 可知何時觸發何種事件

- 環境變數
    - 輸出等級，用以配合Logger
    - Session Secret
    - Redis相關

- 變數表系統
    - 前端部分可無條件存取自身之變數表
    - Socket Server需要經過權限驗證

- 權限系統
    - 目前尚無法修改權限
    - 僅支援預設權限

- Socket Server
    - 變數表
        - 增刪修查變數表內容
        - 列出所有變數表

    - 帳號處理器
        - 將帳號與Socket綁定，提供權限檢查

    - 離線處理器
        - 通知離線之使用者同區之其他使用者
        - 清除Socket與帳號綁定關係

    - 系統事件處理器
        - 新增離線事件

    - Type List
        - 使得處理器的回傳值帶有類別
        - 可用於判斷成功 / 失敗狀態與原因

- API
    - 變數表相關功能
        - 增刪修查變數表內容
        - 新增、改名、刪除變數表
        - 列出自己 / 所有變數表
    - Token相關
        - 可申請Token，用以存取變數表

- Helper
    - Pool
        - 來源自EnhBase

#### Changed
- 環境變數
    - 將JWT相關參數轉變為可調整之變數
    - 環境變數名稱修改

- API
    - 路徑大幅修改
    - 修整API至盡量符合RESTful API

- 資料庫
    - 將各Table之DDL statement拆分檔案
    - DML statement按類別拆分
    - schema升級
        - 增加缺失的CASCADE屬性到Foreign key上
        - 棄用AccountOptions table
        - 增加新的Table
        - 長度不一的String column統一長度

- SocketServer
    - 系統事件處理器
        - 改變登入事件的帳號存取方法
        - 帳號與Socket綁定交由帳號處理器管理

- Session
    - 改由前端管理目前使用者
    - 更改Session資料結構

- interface
    - 整理路徑

#### Bug fixed
- Dockerfile
    - 去除多餘環境變數，使得可以正常build

- 環境變數
    - 預設Server監聽Port改變為80

## v0.0.1 (2025-05-31)
#### Added
- 帳號系統
    - 可使用帳號密碼登入
    - 可支援使用Passkey實現免密碼登入
- Socket Server部分
    - 傳訊功能
        - 一對一
        - 房間內廣播
        - 全體廣播
    - 房間功能
        - 可透過自訂分區代碼以分隔房間
        - 可創建、加入、離開房間
        - 列出所有房間
        - 取得房間內使用者id

#### Changed
- 無

#### Bug fixed
- 無