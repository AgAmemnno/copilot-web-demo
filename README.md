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

## LC特性分析ロジックの概要

本プロジェクトには、ソースコードやコミット履歴から「学習的（L的）」「創造的（C的）」特性を自動推定する分析関数群が実装されています。

### 主な関数
- `estimate_lc_by_filetype(file_path: str) -> dict`
  - ファイルパスから拡張子やパス構造に基づき、L/C/Neutral特性と信頼度を推定します。
- `estimate_lc_by_commit_message(message: str) -> dict`
  - コミットメッセージ（Conventional Commits等）からL/C/Neutral特性・スコア・根拠を推定します。
- `estimate_lc_by_code_changes(diff_stats: dict) -> dict`
  - コードの追加・削除行数や新規ファイルかどうか等の統計情報からL/C/Neutral特性を推定します。
- `summarize_lc_analysis_to_markdown(repo_path: str, branch: str, output_path: str = None) -> str`
  - 指定リポジトリ・ブランチのファイル種別・コミット・コード変更を総合分析し、Markdown形式で要約を生成します。

### 利用例

```python
from src.utils import estimate_lc_by_filetype, estimate_lc_by_commit_message, estimate_lc_by_code_changes, summarize_lc_analysis_to_markdown

# ファイル種別からLC特性を推定
result1 = estimate_lc_by_filetype('src/components/Button.js')
print(result1)  # 例: {'lc_type': 'C', 'confidence': 0.5}

# コミットメッセージからLC特性を推定
result2 = estimate_lc_by_commit_message('feat: add login feature')
print(result2)  # 例: {'lc_type': 'C', 'lc_score': 2.0, ...}

# コード変更量からLC特性を推定
result3 = estimate_lc_by_code_changes({'added_lines': 100, 'deleted_lines': 5, 'is_new_file': True})
print(result3)  # 例: {'lc_type': 'C', 'lc_score': 3.5, ...}

# リポジトリ全体をMarkdownで要約
md = summarize_lc_analysis_to_markdown('d:/WorkSpace/branch-aioserver/msw', 'main')
print(md)
```

### 応用
- これらの関数を組み合わせることで、コミット単位・ブランチ単位・リポジトリ単位でのLC特性分析や、AI間の共通認識構築、レポート自動生成などに活用できます。

---