# aioserver-project

このプロジェクトは、非同期サーバーの設定とGoogleサービスとの連携を行うためのものです。以下のファイルが含まれています。

## ファイル構成

- **aioserver.ipynb**: メインのJupyterノートブックで、非同期サーバーの設定やGoogleサービスとの連携を行います。
  
- **ngrok_setup.py**: ngrokトンネルを設定するためのスクリプトです。ngrokの認証トークンを取得し、指定したポートでトンネルを開始する機能を持っています。
  
- **server.py**: aiohttpを使用して非同期サーバーを実行するためのスクリプトです。POSTリクエストを処理するエンドポイントを設定し、サーバーを起動する機能を持っています.
  
- **requirements.txt**: プロジェクトの依存関係をリストアップしたファイルで、必要なパッケージとそのバージョンを指定します。

## 使用方法

1. 必要なパッケージをインストールするために、以下のコマンドを実行します。

   ```
   pip install -r requirements.txt
   ```

2. `ngrok_setup.py`を実行してngrokトンネルを設定します。

   ```
   python ngrok_setup.py
   ```

3. `server.py`を実行して非同期サーバーを起動します。

   ```
   python server.py
   ```

4. `aioserver.ipynb`を開いて、非同期サーバーとGoogleサービスとの連携を行います。