import os
from pyngrok import ngrok

def start_ngrok(port):
    ngrok_token = os.getenv('NGROK_AUTH_TOKEN')
    if not ngrok_token:
        raise ValueError("NGROK_AUTH_TOKEN is not set in the environment variables.")

    ngrok.set_auth_token(ngrok_token)
    public_url = ngrok.connect(port)
    print(f"ngrok tunnel opened: {public_url}")
    return public_url

if __name__ == "__main__":
    port = 8080  # Specify the port you want to expose
    start_ngrok(port)