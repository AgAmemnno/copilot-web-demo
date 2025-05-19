// src/githubApi.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeOctokit,
  getRepositoryAndFirstProject,
  createIssueInRepo,
  addItemToProject,
  updateProjectItemStatus,
  closeIssue
  // executeGraphQL, // より汎用的なテストも可能
  // executeRestApi
} from './githubApi.js'; // モジュール化したファイルへのパス
import dotenv from 'dotenv';

// .env.test ファイルから環境変数をロード


describe('GitHub Projects V2 API Tests (Actual Calls)', () => {
  const pat = process.env.GH_PAT_FOR_TEST;
  const owner = process.env.TEST_GITHUB_OWNER;
  const repo = process.env.TEST_GITHUB_REPO;

  let repositoryNodeId;
  let projectNodeId;
  let statusFieldNodeId; // 'Status' フィールドのID
  let readyOptionNodeId; // 'Ready' オプションのID
  let inProgressOptionNodeId; // 'In Progress' オプションのID
  let doneOptionNodeId; // 'Done' オプションのID
  let createdIssue; // 作成されたIssueの情報
  let createdProjectItemNodeId; // プロジェクトに追加されたアイテムのNode ID

  beforeAll(() => {
    if (!pat) {
      throw new Error("GH_PAT_FOR_TEST is not set in .env.test. Please provide a valid PAT.");
    }
    if (!owner || !repo) {
      throw new Error("TEST_GITHUB_OWNER and/or TEST_GITHUB_REPO are not set in .env.test.");
    }
    initializeOctokit(pat);
    console.log(`Tests will run against repository: ${owner}/${repo}`);
  });

  it('Step 1: Should fetch repository and project details, and identify status field/options', async () => {
    const response = await getRepositoryAndFirstProject(owner, repo);
    expect(response).toBeDefined();
    expect(response.repository).toBeDefined();
    repositoryNodeId = response.repository.id;
    expect(repositoryNodeId).toBeTypeOf('string');
    console.log(`Repository Node ID: ${repositoryNodeId}`);

    expect(response.repository.projectsV2.nodes.length).toBeGreaterThan(0, "No V2 projects found in this repository. Please create one for testing.");
    const project = response.repository.projectsV2.nodes[0];
    projectNodeId = project.id;
    expect(projectNodeId).toBeTypeOf('string');
    console.log(`Selected Project: ${project.title} (Node ID: ${projectNodeId})`);

    // "Status" という名前の単一選択フィールドを探す (実際のプロジェクトに合わせて調整)
    const statusField = project.fields.nodes.find(f => f.name === 'Status' && f.dataType === 'SINGLE_SELECT');
    expect(statusField, "A 'Status' single-select field was not found in the project. Please create one with options like 'Todo', 'In Progress', 'Done'.").toBeDefined();
    statusFieldNodeId = statusField.id;
    console.log(`Status Field: ${statusField.name} (Node ID: ${statusFieldNodeId})`);

    // "Status" フィールド内のオプションIDを取得 (実際のオプション名に合わせて調整)
    readyOptionNodeId = statusField.options.find(opt => ['Todo', 'Backlog', 'Ready'].includes(opt.name))?.id;
    inProgressOptionNodeId = statusField.options.find(opt => ['In Progress', 'Doing'].includes(opt.name))?.id;
    doneOptionNodeId = statusField.options.find(opt => ['Done', 'Completed', 'Closed'].includes(opt.name))?.id;

    expect(readyOptionNodeId, "'Ready' (or similar) option not found in Status field.").toBeTypeOf('string');
    expect(inProgressOptionNodeId, "'In Progress' (or similar) option not found in Status field.").toBeTypeOf('string');
    expect(doneOptionNodeId, "'Done' (or similar) option not found in Status field.").toBeTypeOf('string');

    console.log(`Ready Option ID: ${readyOptionNodeId}`);
    console.log(`In Progress Option ID: ${inProgressOptionNodeId}`);
    console.log(`Done Option ID: ${doneOptionNodeId}`);
  }, 30000); // API呼び出しのためタイムアウトを延長

  it('Step 2: Should create a new issue and add it as a card to the project', async () => {
    expect(repositoryNodeId, "Repository Node ID not set from previous step").toBeDefined();
    expect(projectNodeId, "Project Node ID not set from previous step").toBeDefined();

    const issueTitle = `[TEST VITEST] New Task ${Date.now()}`;
    const issueBody = "This is a test issue created by Vitest.";
    
    createdIssue = await createIssueInRepo(repositoryNodeId, issueTitle, issueBody);
    expect(createdIssue).toBeDefined();
    expect(createdIssue.id).toBeTypeOf('string');
    expect(createdIssue.number).toBeTypeOf('number');
    console.log(`Created Issue #${createdIssue.number} (Node ID: ${createdIssue.id})`);

    const item = await addItemToProject(projectNodeId, createdIssue.id);
    expect(item).toBeDefined();
    expect(item.id).toBeTypeOf('string');
    createdProjectItemNodeId = item.id;
    console.log(`Added item to project (Item Node ID: ${createdProjectItemNodeId})`);
  }, 30000);

  it('Step 3a: Should change item status to "Ready"', async () => {
    expect(projectNodeId).toBeDefined();
    expect(createdProjectItemNodeId).toBeDefined();
    expect(statusFieldNodeId).toBeDefined();
    expect(readyOptionNodeId).toBeDefined();

    const updatedItem = await updateProjectItemStatus(projectNodeId, createdProjectItemNodeId, statusFieldNodeId, readyOptionNodeId);
    expect(updatedItem).toBeDefined();
    expect(updatedItem.fieldValue.optionId).toBe(readyOptionNodeId);
    console.log(`Item status changed to: ${updatedItem.fieldValue.name}`);
  }, 30000);
  
  it('Step 3b: Should change item status to "In Progress"', async () => {
    expect(projectNodeId).toBeDefined();
    expect(createdProjectItemNodeId).toBeDefined();
    expect(statusFieldNodeId).toBeDefined();
    expect(inProgressOptionNodeId).toBeDefined();

    const updatedItem = await updateProjectItemStatus(projectNodeId, createdProjectItemNodeId, statusFieldNodeId, inProgressOptionNodeId);
    expect(updatedItem).toBeDefined();
    expect(updatedItem.fieldValue.optionId).toBe(inProgressOptionNodeId);
    console.log(`Item status changed to: ${updatedItem.fieldValue.name}`);
  }, 30000);

  it('Step 3c: Should change item status to "Done"', async () => {
    expect(projectNodeId).toBeDefined();
    expect(createdProjectItemNodeId).toBeDefined();
    expect(statusFieldNodeId).toBeDefined();
    expect(doneOptionNodeId).toBeDefined();

    const updatedItem = await updateProjectItemStatus(projectNodeId, createdProjectItemNodeId, statusFieldNodeId, doneOptionNodeId);
    expect(updatedItem).toBeDefined();
    expect(updatedItem.fieldValue.optionId).toBe(doneOptionNodeId);
    console.log(`Item status changed to: ${updatedItem.fieldValue.name}`);
  }, 30000);

  it('Step 4: Should archive item (close the issue)', async () => {
    expect(owner).toBeDefined();
    expect(repo).toBeDefined();
    expect(createdIssue, "createdIssue is not defined from previous step").toBeDefined();
    expect(createdIssue.number, "createdIssue.number is not defined").toBeTypeOf('number');

    const closedIssueData = await closeIssue(owner, repo, createdIssue.number);
    expect(closedIssueData).toBeDefined();
    expect(closedIssueData.state).toBe('closed');
    console.log(`Issue #${createdIssue.number} closed successfully.`);
  }, 30000);

  // afterAll(async () => {
  //   // クリーンアップ処理: 作成したIssueを削除またはテスト用のラベルを外すなど
  //   // ただし、Issueの完全な削除はAPI経由では難しいことが多い
  //   // ここでは、テストが実際のデータに影響を残す可能性があることを認識しておく
  //   if (createdIssue && createdIssue.number) {
  //       console.warn(`[CLEANUP] Test Issue #${createdIssue.number} was created and closed. Manual review/deletion might be needed if it's not archived by project automation.`);
  //   }
  // });
});