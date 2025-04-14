import requests

class CopilotWorkspace:
    def __init__(self):
        self.base_url = "https://api.github.com"

    def _get_headers(self, token):
        return {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }

    def list_repositories(self, token):
        url = f"{self.base_url}/user/repos"
        headers = self._get_headers(token)
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error listing repositories: {response.status_code} - {response.text}")
        return response.json()

    def list_branches(self, token, repo_name):
        url = f"{self.base_url}/repos/{repo_name}/branches"
        headers = self._get_headers(token)
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error listing branches: {response.status_code} - {response.text}")
        return response.json()

    def list_pull_requests(self, token, repo_name):
        url = f"{self.base_url}/repos/{repo_name}/pulls"
        headers = self._get_headers(token)
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error listing pull requests: {response.status_code} - {response.text}")
        return response.json()

    def create_pull_request(self, token, repo_name, title, head, base, body=None):
        url = f"{self.base_url}/repos/{repo_name}/pulls"
        headers = self._get_headers(token)
        data = {
            "title": title,
            "head": head,
            "base": base,
            "body": body
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code != 201:
            raise Exception(f"Error creating pull request: {response.status_code} - {response.text}")
        return response.json()

    def add_comment_to_pull_request(self, token, repo_name, pull_number, comment):
        url = f"{self.base_url}/repos/{repo_name}/issues/{pull_number}/comments"
        headers = self._get_headers(token)
        data = {
            "body": comment
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code != 201:
            raise Exception(f"Error adding comment: {response.status_code} - {response.text}")
        return response.json()

    def merge_pull_request(self, token, repo_name, pull_number, commit_message=None):
        url = f"{self.base_url}/repos/{repo_name}/pulls/{pull_number}/merge"
        headers = self._get_headers(token)
        data = {
            "commit_message": commit_message
        }
        response = requests.put(url, headers=headers, json=data)
        if response.status_code != 200:
            raise Exception(f"Error merging pull request: {response.status_code} - {response.text}")
        return response.json()
