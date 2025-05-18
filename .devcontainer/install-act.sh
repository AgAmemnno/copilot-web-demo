#!/bin/bash
set -e

# actの最新バージョンをインストール (GitHub Releasesから直接取得も可能)
# 公式のインストールスクリプトを利用
echo "Installing act..."
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash -s -- -b /usr/local/bin

echo "act installation complete."