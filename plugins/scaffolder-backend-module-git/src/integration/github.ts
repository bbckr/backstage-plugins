import { ScmIntegrationClient } from '.';
import { UserInfo } from '../actions/git/utils';
import { GithubHttpClient } from './http';

export class GithubIntegrationClient implements ScmIntegrationClient {
  private client: GithubHttpClient;

  constructor(client: GithubHttpClient) {
    this.client = client;
  }

  async getUserInfo(): Promise<UserInfo> {
    const user = await this.client.getUser();
    let email = user.email;

    if (!email) {
      const emails = await this.client.getEmails();
      email = emails.find(email => email.primary)?.email;
    }

    return {
      userName: user.login,
      email: email,
    };
  }
}
