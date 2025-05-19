import pytest
import tempfile
import os
from src.utils import clone_github_repo, list_files_recursive, count_lines_in_file, analyze_repo_files

def test_clone_and_analyze():
    repo_url = "https://github.com/octocat/Hello-World.git"
    with tempfile.TemporaryDirectory() as tmpdir:
        repo_path = clone_github_repo(repo_url, tmpdir)
        files = list_files_recursive(repo_path)
        assert "README" in "".join(files) or "README.md" in "".join(files)
        analysis = analyze_repo_files(repo_path)
        assert isinstance(analysis, list)
        assert all("path" in f and "lines" in f for f in analysis)

def test_count_lines_in_file():
    with tempfile.NamedTemporaryFile("w+", delete=False) as tf:
        tf.write("a\nb\nc\n")
        tf.flush()
        tf.close()
        assert count_lines_in_file(tf.name) == 3
        os.unlink(tf.name)