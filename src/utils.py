import os
import subprocess
from pathlib import Path

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