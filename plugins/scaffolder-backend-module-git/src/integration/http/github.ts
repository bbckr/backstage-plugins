type User = {
  login: string;
  email: string | undefined;
};

type Email = {
  email: string;
  primary: boolean;
};

export class GithubHttpClient {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  async getUser(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Github API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { login: data.login, email: data.email };
  }

  async getEmails(): Promise<Email[]> {
    const response = await fetch(`${this.baseUrl}/user/emails`, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Github API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.map((val: any) => ({ email: val.email, primary: val.primary }));
  }
}
