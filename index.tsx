/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { createTokenAuth } from "@octokit/auth-token";
const auth = createTokenAuth("ghp_PersonalAccessToken01245678900000000");
const authentication = await auth();
console.log(authentication.token);
console.log(authentication.type);
console.log(authentication.clientId);
console.log(authentication.clientSecret);
console.log(authentication.scopes);
console.log(authentication.expiration);
console.log(authentication.tokenType);
console.log(authentication.tokenExpiration);

