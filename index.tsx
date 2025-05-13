/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create_selector } from "./select";
import {
  FinishReason,
  GenerateContentConfig,
  GenerateContentParameters,
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  Part,
  SafetySetting,
} from '@google/genai';

import { Octokit } from "https://esm.sh/@octokit/rest";



const TARGET_GLOBAL_VAR_NAME = 'GITHUB_PAT';
// 簡単なリクエスト: ユーザーのリポジトリ一覧を取得
async function fetchRepositories(octokit) {
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
  // Personal Access Token (PAT) を環境変数から取得
  const token = window[TARGET_GLOBAL_VAR_NAME];

  if (!token) {
    throw new Error("GITHUB_PAT is not set. Please set your Personal Access Token in the environment variables.");
  }
    // Octokit インスタンスを作成
  const octokit = new Octokit({
        auth: token,
  });
  
  await fetchRepositories(octokit);
}

document.addEventListener('DOMContentLoaded', function() {

   
    const selector = create_selector(TARGET_GLOBAL_VAR_NAME);
    selector.open(main);

});



