/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';


export default defineConfig(({ mode }) => {
  // 現在のモード (development, productionなど) に基づいて環境変数をロード
  // プロジェクトルートの .env, .env.local, .env.[mode], .env.[mode].local ファイルから読み込まれる
  const env = loadEnv(mode, process.cwd(), ''); // 第2引数を process.cwd() に変更するとより堅牢です

  return {
    // アプリケーションコード用のグローバル定数定義
    // これにより、クライアントサイドのコードで process.env.API_KEY のようにアクセスできる
    // (Viteがビルド時に実際の値に置き換えます)
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
      // 他にもクライアントサイドで使いたい環境変数があればここに追加
      // 'process.env.VITE_SOME_CONFIG': JSON.stringify(env.VITE_SOME_CONFIG)
    },

    // モジュール解決エイリアス設定
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'), // '@/' でプロジェクトルートを参照
      }
    },

    // Vitest の設定
    test: {
      globals: true, // describe, it, expect などをグローバルスコープにインポートなしで使えるようにする (推奨)
      environment: 'jsdom', // DOM APIをテストで使いたい場合 (例: UIコンポーネントテスト)。APIテストが主なら 'node' でも可。
      include: [
        'src/**/*.test.{js,ts}', // src ディレクトリ配下の .test.js と .test.ts ファイル
        'src/**/*.spec.{js,ts}'  // src ディレクトリ配下の .spec.js と .spec.ts ファイルも対象にする場合
      ],
      // setupFiles: ['./vitest.setup.js'], // グローバルなセットアップスクリプトが必要な場合に指定 (例: グローバルモックなど)
      // include: ['src/**/*.test.{js,ts}'], // テストファイルのパターン (デフォルトは 'src/**/*.{test,spec}.{js,ts,jsx,tsx}')
    },
  };
});
