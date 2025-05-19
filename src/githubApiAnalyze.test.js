import { describe, it, expect, beforeAll } from 'vitest';
import { initializeOctokit, fetchRepoFileTree } from './githubApi.js';
import dotenv from 'dotenv';

// .env.local から環境変数をロード


describe('GitHub GraphQL API ファイル一覧取得テスト', () => {
  const pat = process.env.GH_PAT_FOR_TEST;
  const owner = process.env.TEST_GITHUB_OWNER;
  const repo = process.env.TEST_GITHUB_REPO;
  const branch = process.env.TEST_GITHUB_BRANCH || 'main';

  beforeAll(() => {
    if (!pat) throw new Error("GH_PAT_FOR_TEST is not set in .env.local");
    if (!owner || !repo) throw new Error("TEST_GITHUB_OWNER/REPO is not set in .env.local");
    initializeOctokit(pat);
  });

  it('GraphQLで指定ブランチのファイル一覧を取得できる', async () => {
    const files = await fetchRepoFileTree(owner, repo, branch);
    expect(files).toBeDefined();
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
    // 例: src/index.js など特定ファイルが含まれるか
    console.log('取得ファイル例:', files.slice(0, 5));
  });
});
