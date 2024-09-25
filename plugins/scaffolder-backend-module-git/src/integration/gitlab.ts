import { ScmIntegrationClient } from '.';
import { UserInfo } from '../actions/git/utils';
import { GitLabHttpClient } from './http';

export class GitLabIntegrationClient implements ScmIntegrationClient {
  private client: GitLabHttpClient;

  constructor(client: GitLabHttpClient) {
    this.client = client;
  }

  async getUserInfo(): Promise<UserInfo> {
    const user = await this.client.getUser();
    return {
      userName: user.username,
      email: user.email,
    };
  }
}
