# Node.js v22（Vite/TypeScript開発向け）
ARG VARIANT="22"
FROM mcr.microsoft.com/devcontainers/javascript-node:${VARIANT} AS base
ENV TZ=Asia/Tokyo


# --- Development Stage ---
# ローカル開発用 (Dev Containerで使用)。actを含む。
FROM base AS development

# USER root に切り替えて開発ツールをインストール
USER root

# act インストール用シェルスクリプトをコピーして実行
COPY .devcontainer/install-act.sh /tmp/install-act.sh
RUN chmod +x /tmp/install-act.sh && /tmp/install-act.sh && rm /tmp/install-act.sh

# 必要に応じて他の開発ツールをインストール
# 例: RUN apt-get update && apt-get install -y <開発用ツール> && rm -rf /var/lib/apt/lists/*

# 再度 node ユーザーに戻す
USER node

# 作業ディレクトリは devcontainer.json の workspaceFolder で指定されるパスと連動することが多い
# Dev Containerのワークスペースマウントポイントを考慮
WORKDIR /workspaces/${localWorkspaceFolderBasename}

# 依存パッケージは postCreateCommand でインストール (devcontainer.jsonで設定)
# (例: npm install)
# 実体は .devcontainer/post-create.sh として管理 (Dockerfile内コメントに従う)
# COPY .devcontainer/post-create.sh /usr/local/share/post-create.sh
# RUN chmod +x /usr/local/share/post-create.sh

# --- Production Stage ---
# 本番環境またはCI/CDのビルド/実行用。actや開発ツールは含めない。
FROM base AS production

USER root # パッケージインストールやファイル操作のために一時的にroot

# アプリケーションコードをコピー
WORKDIR /app
COPY --chown=node:node package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# プロジェクトの依存関係をインストール (本番用のみ)
# RUN npm ci --only=production --ignore-scripts
# RUN yarn install --production --frozen-lockfile
# プロジェクトの状況に合わせていずれかを選択 (例としてnpm ci)
RUN if [ -f package-lock.json ]; then npm ci --only=production --ignore-scripts; \
    elif [ -f yarn.lock ]; then yarn install --production --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --prod; \
    else echo "Lockfile not found." && exit 1; fi

COPY --chown=node:node . .

# アプリケーションのビルド (Viteプロジェクトの場合)
# RUN npm run build
# RUN yarn build
RUN if [ -f package-lock.json ]; then npm run build; \
    elif [ -f yarn.lock ]; then yarn build; \
    elif [ -f pnpm-lock.yaml ]; then pnpm run build; \
    else echo "Lockfile not found, cannot build." && exit 1; fi


# 最終的な実行ユーザー
USER node

# (オプション) アプリケーションの起動コマンド
# 例: EXPOSE 3000
# CMD ["npm", "start"] # または "node", "dist/server.js" など