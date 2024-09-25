type User = {
  username: string;
  email: string;
};

function getAuthorizationHeader(token: string): Record<string, string> {
  if (token.startsWith('glpat-')) {
    return {
      'Private-Token': token,
    };
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

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
        ...getAuthorizationHeader(this.token),
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
