import logging
from pathlib import Path
import base64
import re # パス解析と検証用
from cryptography import fernet # Session 暗号化用
import os
import json
from aiohttp import web
# aiohttp_session をインポート
from aiohttp_session import setup as setup_session
from aiohttp_session import get_session
from aiohttp_session.cookie_storage import EncryptedCookieStorage
import asyncio
# ロギング設定
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# 静的ページコンテンツのベースディレクトリ
BASE_STATIC_PAGES_DIR = Path(__file__).parent.parent / "static"
ITEMS_PAGE_DIR = BASE_STATIC_PAGES_DIR / "pages"


# ロックオブジェクトを作成
shared_lock = asyncio.Lock()
shared_dict = {}

# 'with'ブロックを抜けると、executorは自動的にシャットダウン（実行中のタスク完了を待つ）
print("--- デモ終了 ---")
# COMPONENTS_DIR = BASE_STATIC_PAGES_DIR / "components" # 必要なら定義
async def handle_index(request):
    return web.FileResponse('static/pages/index.html')

# --- すべてのリクエストを処理する統合ハンドラ ---
async def master_handler(request: web.Request) -> web.StreamResponse:
    """
    すべてのGETリクエストを処理し、パスに基づいて処理を振り分ける。
    - /pages/{id} -> 該当ページのindex.htmlを返し、セッションにidを保存
    - /static/{asset} -> セッションのページIDに基づき、該当ページのassetを返す
    - / -> pages/index.html を返す
    - (オプション) その他の共通静的ファイル
    """
    # request.match_info['tail'] には '/' 以降のパス全体が入る
    # request.path を使う方が直感的かもしれない
    path = "/" + request.match_info.get('tail', '')
    log.info(f"Master handler received request for path: {path}")

    
    # 1. ルートパス '/' の処理
    if path == '/':
        return web.FileResponse(f'{BASE_STATIC_PAGES_DIR}/pages/index.html')


    # 2. /pages/{page_identifier} の処理 (以前の handle_item_page 相当)
    # 正規表現で /pages/ から始まり、安全な文字で構成されるIDを持つパスにマッチさせる
    pages_match = re.match(r'^/pages/([a-zA-Z0-9_-]+)$', path)
    
    if pages_match:
        page_identifier = pages_match.group(1)
        target_dir = ITEMS_PAGE_DIR / page_identifier
        target_html_file = target_dir / "index.html"
        # ファイル存在チェック
        async with shared_lock: 
            shared_dict['page_context'] = page_identifier
        if not target_html_file.is_file():
            raise web.HTTPNotFound(reason=f"Page content for '{page_identifier}' not found")
        try:
            # ★ セッションに現在のページ識別子を保存
            response = web.FileResponse(target_html_file)
            # セッションデータを含むクッキーがレスポンスヘッダーにセットされる
            return response
        except Exception as e:
            log.error(f"Error serving file {target_html_file}: {e}")
            raise web.HTTPInternalServerError(reason="Error serving page content")
  
    pages_static = re.match(r"^/static/(?:[^/]+/)*([^/]+)\.(js|css|png|svg)$", path)
    if pages_static:
        PagesID = "1"
        async with shared_lock: 
            PagesID = shared_dict['page_context']
        target_file = f"{ITEMS_PAGE_DIR}/{PagesID}/static/{pages_static.group(1)}.{pages_static.group(2)}"
        try:
            return web.FileResponse(target_file)

        except FileNotFoundError:
            log.warning(f"CSS asset file not found at resolved path: {target_file}")
            raise web.HTTPNotFound(reason=f"Asset '{path}' not found")
        except Exception as e:
            log.warning(f"Error resolving or accessing CSS asset: {target_file}, Error: {e}")
            raise web.HTTPInternalServerError(reason=f"Error serving asset '{path}'")


   
    # 正規表現パターン
    # ^             : 文字列の先頭
    # /             : 先頭の '/'
    # (?:[^/]+/)* : 0回以上の 'ディレクトリ名/' の繰り返し
    #   ?:          : キャプチャしないグループ化
    #   [^/]+       : '/' 以外の1文字以上の文字列（ディレクトリ名）
    #   /           : ディレクトリ区切りの '/'
    #   * : 直前のグループ（'ディレクトリ名/'）が0回以上繰り返される
    # ([^/]+)       : '/' 以外の1文字以上の文字列（ファイル名本体、キャプチャグループ1）
    # \.            : '.' 文字そのもの
    # (js|css|png)  : 'js' または 'css' または 'png'（拡張子、キャプチャグループ2）
    # $             : 文字列の末尾
    regex_pattern = r"^/(?:[^/]+/)*([^/]+)\.(js|css|png|svg)$"
    css_match = re.match(regex_pattern, path)
    if css_match:
        target_file = f"{BASE_STATIC_PAGES_DIR}{path}"
        target_file = target_file.replace("pages/","")
        try:

            return web.FileResponse(target_file)

        except FileNotFoundError:
            log.warning(f"CSS asset file not found at resolved path: {target_file}")
            raise web.HTTPNotFound(reason=f"Asset '{path}' not found")
        except Exception as e:
            log.warning(f"Error resolving or accessing CSS asset: {target_file}, Error: {e}")
            raise web.HTTPInternalServerError(reason=f"Error serving asset '{path}'")

    # (オプション) 4. その他の共通静的ファイルの処理
    # 例: /components/common.css などを処理したい場合
    # common_static_match = re.match(r'^/components/(.+)$', path)
    # if common_static_match:
    #     asset_path_part = common_static_match.group(1)
    #     # asset_path_part のサニタイズ (../ などを含まないかチェック) が重要
    #     if '..' in asset_path_part or asset_path_part.startswith('/'):
    #         log.warning(f"Potential path traversal in common static asset request: {asset_path_part}")
    #         raise web.HTTPForbidden(reason="Invalid asset path")
    #
    #     # ここでは BASE_STATIC_PAGES_DIR を起点とする例 (COMPONENTS_DIR を使うならそちらで)
    #     target_file = BASE_STATIC_PAGES_DIR / "components" / asset_path_part
    #     log.info(f"Attempting to serve common static asset from components: {target_file}")
    #     # Path Traversal 対策 (BASE_STATIC_PAGES_DIR/components 基準で)
    #     try:
    #         resolved_path = target_file.resolve(strict=True)
    #         base_components_dir = (BASE_STATIC_PAGES_DIR / "components").resolve()
    #         if resolved_path.is_file() and resolved_path.is_relative_to(base_components_dir):
    #              return web.FileResponse(resolved_path)
    #         else:
    #              log.warning(f"Common static asset not found or access denied: {resolved_path}")
    #              raise web.HTTPNotFound()
    #     except FileNotFoundError:
    #          log.warning(f"Common static asset file not found: {target_file}")
    #          raise web.HTTPNotFound()
    #     except Exception as e:
    #         log.warning(f"Error resolving or accessing common static asset: {target_file}, Error: {e}")
    #         raise web.HTTPInternalServerError()


    # 上記のどのパターンにもマッチしない場合
    log.warning(f"No matching route logic found for path: {path}")
    raise web.HTTPNotFound(reason=f"The requested resource was not found on this server.")

# Define the base path to the JSON files
data_base_path = BASE_STATIC_PAGES_DIR / "components" / "hedron" / "data"

async def handle_get_polyhedron(request):
    try:
        # Extract the file number from the request
        file_number = request.match_info.get('file_number', '6')
        data_file_path = os.path.join(data_base_path, f'{file_number}.json')

        # Read the JSON file
        with open(data_file_path, 'r') as file:
            data = json.load(file)
        return web.json_response(data)
    except FileNotFoundError:
        return web.json_response({'error': 'File not found'}, status=404)
    except json.JSONDecodeError:
        return web.json_response({'error': 'Invalid JSON format'}, status=500)

# Create the app and define routes


# --- アプリケーション設定 ---
def create_app() -> web.Application: # async は不要
    app = web.Application()

    # FERNET_KEY は本番環境では環境変数などから読み込むべき
    SECRET_KEY =b'dUxQMkZwOGdVWi0xaE5BQkxaVDRWMFZzSGJhdkJwcnpiZ2V2blBGcXRkST0=' # ★★★ 必ず生成した独自キーに置き換える ★★★

    try:
        fernet_key = base64.urlsafe_b64decode(SECRET_KEY)
        f = fernet.Fernet(fernet_key)
    except Exception as e:
        log.error(f"Failed to initialize Fernet with provided SECRET_KEY: {e}")
        raise ValueError("Invalid SECRET_KEY provided for session encryption.") from e

    storage = EncryptedCookieStorage(f)
    setup_session(app, storage)
    log.info("Session middleware configured.")

    # --- ルート設定 ---
    # すべてのGETリクエストを master_handler に送る
    # '/{tail:.*}' はルートパス '/' を含むすべてのパスにマッチする正規表現
    app.router.add_get('/{tail:.*}', master_handler)
    app.router.add_get('/',handle_index)
    log.info("Catch-all GET route configured to use master_handler.")
    app.router.add_get('/hedron/data/{file_number}.json', handle_get_polyhedron)

    # 必要であれば POST など他のメソッドも同様に master_handler (または別のハンドラ) にルーティング
    # app.router.add_post('/{tail:.*}', master_handler_for_post)

    log.info("Application routes configured.")
    return app


if __name__ == '__main__':
    try:
        app = create_app() # await は不要
        web.run_app(app, host='127.0.0.1', port=9000)
        log.info("Server stopped.")
    except Exception as e:
        # アプリケーション起動時のエラーを詳細にログ記録
        log.exception(f"Failed to run application: {e}")