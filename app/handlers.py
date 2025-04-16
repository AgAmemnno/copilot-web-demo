from aiohttp import web
import json
from google import genai
from google.genai import types
from typing import List

from dotenv import load_dotenv
import os


load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key)



async def handle_index(_):
    return web.FileResponse('static/index.html')


async def handle_get(request):
    req_type = 1
    if req_type == 0:
        # https://generativelanguage.googleapis.com/v1beta/models
        models  =""
        for m in client.models.list():
            models += m.name
        res = models
    elif req_type == 1:
        # https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
        
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents='Tell me a story in 300 words.'
        )
        res = response.text
    return web.json_response({"message": f"This is {res}"})

async def handle_post(request):
    try:
        data = await request.json()
        return web.json_response({"received": data})
    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    try:
        # Fetch clientID and apiKey from environment variables
        client_id = os.getenv("CLIENT_ID")
        workspace_key = os.getenv("GOOGLE_WORKSPACE_KEY")

        # Ensure both values are available
        if not client_id or not api_key:
            return web.json_response({"error": "Missing credentials"}, status=500)

        # Return the credentials as JSON
        return web.json_response({
            "clientID": client_id,
            "apiKey": workspace_key
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)