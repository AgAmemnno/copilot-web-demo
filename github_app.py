import requests
import jwt
import time

class GithubApp:
    def __init__(self, app_id, private_key):
        self.app_id = app_id
        self.private_key = private_key
        self.base_url = "https://api.github.com"

    def _get_jwt(self):
        payload = {
            "iat": int(time.time()),
            "exp": int(time.time()) + (10 * 60),
            "iss": self.app_id
        }
        token = jwt.encode(payload, self.private_key, algorithm="RS256")
        return token

    def _get_headers(self):
        return {
            "Authorization": f"Bearer {self._get_jwt()}",
            "Accept": "application/vnd.github.v3+json"
        }

    def get_installations(self):
        url = f"{self.base_url}/app/installations"
        headers = self._get_headers()
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error fetching installations: {response.status_code} - {response.text}")
        return response.json()

    def create_installation_access_token(self, installation_id):
        url = f"{self.base_url}/app/installations/{installation_id}/access_tokens"
        headers = self._get_headers()
        response = requests.post(url, headers=headers)
        if response.status_code != 201:
            raise Exception(f"Error creating access token: {response.status_code} - {response.text}")
        return response.json()

    def list_repositories(self, installation_id):
        token_data = self.create_installation_access_token(installation_id)
        access_token = token_data["token"]
        url = f"{self.base_url}/installation/repositories"
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error listing repositories: {response.status_code} - {response.text}")
        return response.json()
