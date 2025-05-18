#!/bin/bash
set -e

# 依存パッケージのインストール
npm install

# .envファイルの初期化（なければexampleからコピー）
if [ ! -f .env ]; then
  cp .env.example .env
  echo "INFO: .env file created from .env.example. Please configure it as needed."
else
  echo "INFO: .env file already exists. Skipping creation."
fi
