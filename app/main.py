from aiohttp import web
from app.routes import setup_routes



async def init_app():
    app = web.Application()
    setup_routes(app)

    return app

if __name__ == '__main__':
    app = init_app()
    web.run_app(app, host='127.0.0.1', port=9000)