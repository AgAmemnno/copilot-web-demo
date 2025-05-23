import asyncio
from aiohttp import web

async def handle_post(request):
    try:
        data = await request.json()
        print("Received data:", data)
        response_data = {
            "status": "success",
            "received": data,
            "message": "Data received successfully!"
        }
        return web.json_response(response_data)
    except json.JSONDecodeError:
        print("Invalid JSON received")
        return web.Response(status=400, text="Invalid JSON format")
    except Exception as e:
        print(f"Error processing request: {e}")
        return web.Response(status=500, text=f"Internal Server Error: {e}")

app = web.Application()
app.router.add_post('/process', handle_post)

async def run_server(port=8080):
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', port)
    print(f"Starting server on http://localhost:{port} ...")
    await site.start()
    print(f"Server started on port {port}")
    while True:
        await asyncio.sleep(3600)

if __name__ == '__main__':
    try:
        asyncio.run(run_server(8080))
    except KeyboardInterrupt:
        print("Server stopped manually.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")