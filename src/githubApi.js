// src/githubApi.js
import { Octokit } from "octokit";

let octokitInstance;

/**
 * Initializes the Octokit instance with a Personal Access Token.
 * @param {string} pat - GitHub Personal Access Token.
 * @returns {Octokit} The initialized Octokit instance.
 * @throws {Error} If PAT is not provided.
 */
export function initializeOctokit(pat) {
  if (!pat || typeof pat !== 'string' || pat.trim() === '') {
    throw new Error("GitHub PAT is required and must be a non-empty string.");
  }
  octokitInstance = new Octokit({ auth: pat });
  console.log("Octokit initialized.");
  return octokitInstance;
}



/**
 * 指定リポジトリ・ブランチのファイル一覧をGraphQLで取得
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @returns {Promise<string[]>} ファイルパスの配列
 */
export async function fetchRepoFileTree(owner, repo, branch = "main") {
  if (!octokitInstance) throw new Error("Octokit is not initialized. Call initializeOctokit(pat) first.");

  // GitHub GraphQL API: repository.object(expression: "branch:") でツリー取得
  const query = `
    query($owner: String!, $repo: String!, $expression: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              name
              type
              path
            }
          }
        }
      }
    }
  `;
  const expression = `${branch}:`;
  const res = await octokitInstance.graphql(query, {
    owner,
    repo,
    expression,
  });

  // ルート直下のみ取得。再帰的に全ファイルを取得したい場合は再帰処理を追加
  const entries = res.repository.object?.entries || [];
  // ディレクトリも含まれるので、type === 'blob'のみ抽出
  const files = entries.filter(e => e.type === 'blob').map(e => e.path);

  // ディレクトリも再帰的に探索
  async function walkTree(prefix) {
    const q = `
      query($owner: String!, $repo: String!, $expression: String!) {
        repository(owner: $owner, name: $repo) {
          object(expression: $expression) {
            ... on Tree {
              entries {
                name
                type
                path
              }
            }
          }
        }
      }
    `;
    const expr = `${branch}:${prefix}`;
    const r = await octokitInstance.graphql(q, { owner, repo, expression: expr });
    const ents = r.repository.object?.entries || [];
    let result = [];
    for (const ent of ents) {
      if (ent.type === 'blob') {
        result.push(prefix + ent.name);
      } else if (ent.type === 'tree') {
        const sub = await walkTree(prefix + ent.name + '/');
        result = result.concat(sub);
      }
    }
    return result;
  }

  // ルート直下のディレクトリも再帰的に探索
  let allFiles = [...files];
  for (const entry of entries) {
    if (entry.type === 'tree') {
      const subFiles = await walkTree(entry.name + '/');
      allFiles = allFiles.concat(subFiles);
    }
  }
  return allFiles;
}

// ...existing code...

/**
 * 指定リポジトリ・ブランチの全ファイル一覧とサイズをGraphQLで再帰的に取得
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @returns {Promise<Array<{path: string, size: number|null}>>}
 */
export async function fetchRepoFileTreeWithSize(owner, repo, branch = "main") {
  if (!octokitInstance) throw new Error("Octokit is not initialized. Call initializeOctokit(pat) first.");

  // 再帰的にtreeをたどり、ファイルパスとサイズを取得
  async function walkTree(prefix) {
    const query = `
      query($owner: String!, $repo: String!, $expression: String!) {
        repository(owner: $owner, name: $repo) {
          object(expression: $expression) {
            ... on Tree {
              entries {
                name
                type
                path
              }
            }
          }
        }
      }
    `;
    const expr = `${branch}:${prefix}`;
    const res = await octokitInstance.graphql(query, { owner, repo, expression: expr });
    const entries = res.repository.object?.entries || [];
    let result = [];
    for (const ent of entries) {
      if (ent.type === 'blob') {
        // ファイルサイズを取得
        const sizeQuery = `
          query($owner: String!, $repo: String!, $expression: String!) {
            repository(owner: $owner, name: $repo) {
              object(expression: $expression) {
                ... on Blob {
                  byteSize
                }
              }
            }
          }
        `;
        const fileExpr = `${branch}:${prefix}${ent.name}`;
        let size = null;
        try {
          const sizeRes = await octokitInstance.graphql(sizeQuery, { owner, repo, expression: fileExpr });
          size = sizeRes.repository.object?.byteSize ?? null;
        } catch (e) {
          size = null;
        }
        result.push({ path: prefix + ent.name, size });
      } else if (ent.type === 'tree') {
        const sub = await walkTree(prefix + ent.name + '/');
        result = result.concat(sub);
      }
    }
    return result;
  }

  return await walkTree('');
}

// ...existing code...

/**
 * Executes a GitHub GraphQL query.
 * @param {string} query - The GraphQL query string.
 * @param {object} variables - Variables for the GraphQL query.
 * @returns {Promise<object>} The GraphQL response data.
 * @throws {Error} If Octokit is not initialized or if the API call fails.
 */
export async function executeGraphQL(query, variables) {
  if (!octokitInstance) {
    throw new Error("Octokit not initialized. Call initializeOctokit(pat) first.");
  }
  console.log(`Executing GraphQL query with variables: ${JSON.stringify(variables)}`);
  try {
    const response = await octokitInstance.graphql(query, variables);
    console.log("GraphQL Response:", JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error("GraphQL API Error Details:", error);
    let errorMessage = `GraphQL API Error: ${error.message || 'Unknown error'}`;
    if (error.data && error.data.errors) {
        errorMessage += `\nGraphQL Errors:\n${JSON.stringify(error.data.errors, null, 2)}`;
    } else if (error.response && error.response.data) {
        errorMessage += `\nAPI Response Data:\n${JSON.stringify(error.response.data, null, 2)}`;
    }
    if (error.status) errorMessage += `\nStatus Code: ${error.status}`;
    throw new Error(errorMessage); // Re-throw a more informative error
  }
}

/**
 * Executes a GitHub REST API request.
 * @param {'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'} method - HTTP method.
 * @param {string} endpoint - API endpoint path (e.g., /repos/{owner}/{repo}/issues).
 * @param {object} params - Parameters for the request (e.g., path params, query params, body).
 * @returns {Promise<object>} The REST API response data.
 * @throws {Error} If Octokit is not initialized or if the API call fails.
 */
export async function executeRestApi(method, endpoint, params) {
  if (!octokitInstance) {
    throw new Error("Octokit not initialized. Call initializeOctokit(pat) first.");
  }
  console.log(`Executing REST API ${method} ${endpoint} with params: ${JSON.stringify(params)}`);
  try {
    const response = await octokitInstance.request(`${method.toUpperCase()} ${endpoint}`, params);
    console.log("REST API Response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error("REST API Error Details:", error);
    let errorMessage = `REST API Error: ${error.message || 'Unknown error'}`;
    if (error.response && error.response.data) errorMessage += `\nAPI Response Data:\n${JSON.stringify(error.response.data, null, 2)}`;
    if (error.status) errorMessage += `\nStatus Code: ${error.status}`;
    throw new Error(errorMessage);
  }
}

// HTML内の各ステップに対応する関数をここに追加していく
// 例: プロジェクト情報を取得する関数
export async function getRepositoryAndFirstProject(owner, repo) {
  const query = `
    query GetRepositoryProjectsAndId($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        id
        projectsV2(first: 1, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            id
            title
            number
            fields(first: 20) {
              nodes {
                ... on ProjectV2Field { id, name, dataType }
                ... on ProjectV2SingleSelectField { options { id, name } }
              }
            }
          }
        }
        milestones(first: 20, states: [OPEN]) {
            nodes { id, number, title, dueOn }
        }
      }
    }`;
  return executeGraphQL(query, { owner, repo });
}

// 例: Issueを作成する関数
export async function createIssueInRepo(repoNodeId, title, body, milestoneNodeId = null) {
  const mutation = `
    mutation CreateIssueForProject($repoId: ID!, $title: String!, $body: String, $milestoneId: ID) {
      createIssue(input: {
        repositoryId: $repoId, title: $title, body: $body, milestoneId: $milestoneId
      }) {
        issue { id, number, title, url }
      }
    }`;
  const variables = { repoId: repoNodeId, title, body };
  if (milestoneNodeId) {
    variables.milestoneId = milestoneNodeId;
  }
  const response = await executeGraphQL(mutation, variables);
  return response.createIssue.issue;
}

// 例: プロジェクトにアイテムを追加する関数
export async function addItemToProject(projectNodeId, contentNodeId) {
  const mutation = `
    mutation AddItemToProject($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item { id }
      }
    }`;
  const response = await executeGraphQL(mutation, { projectId: projectNodeId, contentId: contentNodeId });
  return response.addProjectV2ItemById.item;
}

// 例: アイテムのステータスを変更する関数
export async function updateProjectItemStatus(projectNodeId, itemNodeId, fieldId, optionId) {
    const mutation = `
        mutation UpdateItemStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
            updateProjectV2ItemFieldValue(input: {
                projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
                value: { singleSelectOptionId: $optionId }
            }) {
                projectV2Item {
                    id
                    fieldValue(fieldId: $fieldId) {
                        ... on ProjectV2ItemFieldSingleSelectValue { name, optionId }
                    }
                }
            }
        }`;
    const response = await executeGraphQL(mutation, { projectId: projectNodeId, itemId: itemNodeId, fieldId, optionId });
    return response.updateProjectV2ItemFieldValue.projectV2Item;
}

// 例: Issueをクローズする関数 (REST API)
export async function closeIssue(owner, repo, issueNumber) {
    return executeRestApi('PATCH', `/repos/{owner}/{repo}/issues/{issue_number}`, {
        owner,
        repo,
        issue_number: issueNumber,
        state: 'closed'
    });
}
