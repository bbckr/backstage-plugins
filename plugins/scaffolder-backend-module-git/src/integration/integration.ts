import { GithubIntegration, GitLabIntegration } from '@backstage/integration';
import { UserInfo } from '../actions/git/utils';
import { GitLabIntegrationClient } from './gitlab';
import { GithubHttpClient, GitLabHttpClient } from './http';
import { GithubIntegrationClient } from './github';

export interface ScmIntegrationClient {
  getUserInfo(): Promise<UserInfo>;
}

export function initScmIntegrationClient(
  integration: GitLabIntegration | GithubIntegration,
): ScmIntegrationClient {
  const config = integration.config;

  if (config.token === undefined) {
    throw new Error('No token provided');
  }

  if (config.apiBaseUrl === undefined) {
    throw new Error('No API base URL provided');
  }

  if (integration instanceof GitLabIntegration) {
    const client = new GitLabHttpClient(config.token, config.apiBaseUrl);
    return new GitLabIntegrationClient(client);
  }

  if (integration instanceof GithubIntegration) {
    const client = new GithubHttpClient(config.token, config.apiBaseUrl);
    return new GithubIntegrationClient(client);
  }

  throw new Error('Unsupported integration');
}
