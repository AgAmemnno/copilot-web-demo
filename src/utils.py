import os
import subprocess
from pathlib import Path

import json
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

LOCAL = False
try:
    from google.colab import drive # Google Driveにアクセスするため
    from google.colab import userdata # Secretsにアクセスするため
    from google.colab import auth # Google認証用
except ImportError:
    LOCAL = True
    from dotenv import load_dotenv

def list_calendars(service):
    calendar_list = service.calendarList().list().execute()
    calendars = calendar_list.get('items', [])
    return calendars


def credentials():
    """
    Google APIの認証情報を取得する。
    """
    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/keep',
        'https://www.googleapis.com/auth/drive'
    ]
    if LOCAL:
        load_dotenv()  # .envファイルを読み込む
        SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    else:
        SERVICE_ACCOUNT_FILE = userdata.get('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build('calendar', 'v3', credentials=credentials)
    print(list_calendars(service))
    print(f"service from {SERVICE_ACCOUNT_FILE} {service}")


credentials()

def clone_github_repo(repo_url: str, dest_dir: str) -> Path:
    """
    指定したGitHubリポジトリをdest_dirにクローンする。
    既に存在する場合は何もしない。
    """
    dest = Path(dest_dir)
    if not dest.exists():
        subprocess.run(["git", "clone", repo_url, dest_dir], check=True)
    return dest

def list_files_recursive(base_dir: str):
    """
    指定ディレクトリ以下の全ファイルパスを再帰的にリストアップする。
    """
    file_list = []
    for root, _, files in os.walk(base_dir):
        for f in files:
            file_list.append(os.path.relpath(os.path.join(root, f), base_dir))
    return file_list

def count_lines_in_file(file_path: str) -> int:
    """
    ファイルの行数をカウントする。
    """
    with open(file_path, encoding="utf-8", errors="ignore") as f:
        return sum(1 for _ in f)

def analyze_repo_files(base_dir: str):
    """
    ディレクトリ以下の全ファイルのパスと行数を返す。
    """
    files = list_files_recursive(base_dir)
    return [{"path": f, "lines": count_lines_in_file(os.path.join(base_dir, f))} for f in files]