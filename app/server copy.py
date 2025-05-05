import logging
from pathlib import Path
import base64
from cryptography import fernet # Session 暗号化用

from aiohttp import web
# aiohttp_session をインポート
from aiohttp_session import setup as setup_session
from aiohttp_session import get_session     # SimpleCookieStorage
from aiohttp_session.cookie_storage import EncryptedCookieStorage
# ロギング設定
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# 静的ページコンテンツのベースディレクトリ
BASE_STATIC_PAGES_DIR = Path(__file__).parent.parent / "static"
ITEMS_PAGE_DIR = BASE_STATIC_PAGES_DIR / "pages"
COMPONENTS_DIR = BASE_STATIC_PAGES_DIR


async def handle_item_page(request: web.Request) -> web.StreamResponse:
    """
    /items/page/{page_identifier} のリクエストを処理し、
    対応するディレクトリの index.html を返し、セッションにコンテキストを保存する。
    """
    page_identifier = request.match_info.get('page_identifier', None)
    if not page_identifier:
        log.warning("Page identifier not found in request")
        raise web.HTTPNotFound(reason="Page identifier missing")

    target_dir = ITEMS_PAGE_DIR / page_identifier
    target_html_file = target_dir / "index.html"

    log.info(f"Attempting to serve page: identifier='{page_identifier}', path='{target_html_file}'")

    if not target_html_file.is_file():
        log.warning(f"Target HTML file not found: {target_html_file}")
        raise web.HTTPNotFound(reason=f"Page content for '{page_identifier}' not found")

    try:
        # ★ セッションに現在のページ識別子を保存
        session = await get_session(request)
        session['current_page_context'] = page_identifier
        log.info(f"Stored page context '{page_identifier}' in session.")

        response = web.FileResponse(target_html_file)
        # セッションデータを含むクッキーがレスポンスヘッダーにセットされる
        return response
    except Exception as e:
        log.error(f"Error serving file {target_html_file}: {e}")
        raise web.HTTPInternalServerError(reason="Error serving page content")



async def handle_index(request):
    return web.FileResponse('static/pages/index.html')


async def handle_page_specific_asset(request: web.Request) -> web.StreamResponse:
    # (変更なし)
    asset_name = request.match_info.get('asset_name', None)
    if not asset_name:
        raise web.HTTPNotFound(reason="Page specific asset name missing")
    session = await get_session(request)
    page_context = session.get('current_page_context')
    if not page_context:
        log.warning(f"Page context not found in session for asset request: '{asset_name}'")
        raise web.HTTPNotFound(reason=f"Cannot determine context for asset '{asset_name}'")
    target_file = ITEMS_PAGE_DIR / page_context / asset_name
    log.info(f"Attempting to serve page specific asset: '{asset_name}' for context '{page_context}' from '{target_file}'")
    # Path Traversal 対策 (簡易)
    try:
        resolved_path = target_file.resolve()
        page_dir_for_context = ITEMS_PAGE_DIR / page_context
        if not resolved_path.is_relative_to(page_dir_for_context.resolve()):
             log.warning(f"Path traversal attempt detected for page asset: {target_file}")
             raise web.HTTPForbidden(reason="Access denied")
    except Exception as e:
        log.warning(f"Path resolution failed or invalid path for page asset: {target_file}, Error: {e}")
        raise web.HTTPNotFound(reason=f"Page specific asset not accessible or found: {asset_name}")
    if not resolved_path.is_file():
        log.warning(f"Page specific asset not found: {resolved_path}")
        raise web.HTTPNotFound(reason=f"Asset '{asset_name}' not found for page '{page_context}'")
    try:
        return web.FileResponse(resolved_path)
    except Exception as e:
        log.error(f"Error serving page specific asset {resolved_path}: {e}")
        raise web.HTTPInternalServerError(reason="Error serving page specific asset")


# --- アプリケーション設定 ---
async def create_app() -> web.Application:
    app = web.Application()

    # FERNET_KEY は本番環境では環境変数などから読み込むべき
    # 初回実行時などに生成: print(base64.urlsafe_b64encode(fernet.Fernet.generate_key()))
    SECRET_KEY =b'dUxQMkZwOGdVWi0xaE5BQkxaVDRWMFZzSGJhdkJwcnpiZ2V2blBGcXRkST0=' # ★★★ 必ず生成した独自キーに置き換える ★★★

    fernet_key = base64.urlsafe_b64decode(SECRET_KEY) # 例: 必ず独自キー生成
    print(f"DEBUG: SECRET_KEY Type: {type(SECRET_KEY)}")
    print(f"DEBUG: SECRET_KEY Value: {SECRET_KEY}")
    print(f"DEBUG: SECRET_KEY Length: {len(SECRET_KEY)}")
    

    f = fernet.Fernet(fernet_key)
    storage = EncryptedCookieStorage(f)
    setup_session(app, storage)
    log.info("Session middleware configured.")
    # ---

    # --- ルート設定 ---
    # ★ add_static を使用して /components/ 以下の静的ファイルを提供
    # URL /components/ が FILESYSTEM の COMPONENTS_DIR (例: static_pages/components/) に対応

    if COMPONENTS_DIR.is_dir(): # ディレクトリが存在するか確認
        app.router.add_static('/', COMPONENTS_DIR)
        log.info(f"Serving static files for '/components' from '{COMPONENTS_DIR}'")
    else:
        log.warning(f"Components directory not found: '{COMPONENTS_DIR}', static route '/components' not added.")

    # ページ固有アセットハンドラ (変更なし、必要なら asset_name のパターンを調整)
    app.router.add_get(r'/static/{asset_name:style\.css|script\.js}', handle_page_specific_asset)
    # あるいはより汎用的に:
    # app.router.add_get(r'/{asset_name:.+\.(css|js|png|jpg|jpeg|gif|svg)}', handle_page_specific_asset)

    # 動的ページハンドラ (変更なし)
    app.router.add_get('/pages/{page_identifier}', handle_item_page)


    app.router.add_get('/', handle_index)

    log.info("Application routes configured.")
    return app


if __name__ == '__main__':
    try:
        app = create_app() # await は不要
        web.run_app(app, host='127.0.0.1', port=9000)
        log.info("Server stopped.")
    except Exception as e:
        log.exception(f"Failed to run application: {e}")