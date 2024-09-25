type User = {
  username: string;
  email: string;
};

export class GitLabHttpClient {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  async getUser(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: {
        Authorization: `Private-Token ${this.token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { username: data.username, email: data.email };
  }
}
