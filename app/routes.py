from aiohttp import web
from .handlers import handle_index,handle_get,handle_post

def setup_routes(app):
    app.router.add_get('/', handle_index)
    app.router.add_static('/', './static')
    # Add GET and POST routes
    app.router.add_get('/api/get', handle_get)
    app.router.add_post('/api/post', handle_post)