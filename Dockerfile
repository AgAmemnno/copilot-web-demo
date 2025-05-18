# Node.js v22（Vite/TypeScript開発向け）
ARG VARIANT="22-bookworm"
FROM mcr.microsoft.com/devcontainers/javascript-node:0-${VARIANT}

# 必要に応じて追加ツールやパッケージをここでインストール可能
# 例: RUN apt-get update && apt-get install -y <必要なパッケージ>

# デフォルトは node ユーザー
USER node

# 作業ディレクトリは devcontainer.json の workspaceFolder で指定
# WORKDIR /workspaces/${localWorkspaceFolderBasename}

# 依存パッケージは postCreateCommand でインストール
# 実体は .devcontainer/post-create.sh として管理
