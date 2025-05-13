/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Octokit } from "https://esm.sh/@octokit/rest";

// Personal Access Token (PAT) を環境変数から取得
const token = window.globalThis.process.env.GITHUB_PAT;

if (!token) {
  throw new Error("GITHUB_PAT is not set. Please set your Personal Access Token in the environment variables.");
}

// Octokit インスタンスを作成
const octokit = new Octokit({
  auth: token,
});

// 簡単なリクエスト: ユーザーのリポジトリ一覧を取得
async function fetchRepositories() {
  try {
    const response = await octokit.rest.repos.listForAuthenticatedUser();
    console.log("Repositories:");
    response.data.forEach((repo) => {
      console.log(`- ${repo.name}`);
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
  }
}

// メイン関数
async function main() {
  console.log("Fetching repositories for the authenticated user...");
  await fetchRepositories();
}

main();