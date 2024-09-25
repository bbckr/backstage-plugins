import { GithubHttpClient } from '.';

global.fetch = jest.fn();

describe('GithubHttpClient', () => {
  const mockToken = 'mock-token';
  const mockBaseUrl = 'https://api.github.com';
  let client: GithubHttpClient;

  beforeEach(() => {
    client = new GithubHttpClient(mockToken, mockBaseUrl);
    jest.clearAllMocks();
  });

  it('should fetch user data correctly', async () => {
    const mockUserResponse = {
      login: 'mockLogin',
      email: 'mockEmail@example.com',
      type: 'User',
      site_admin: false,
      name: 'bri becker',
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserResponse,
    });

    const user = await client.getUser();

    expect(fetch).toHaveBeenCalledWith(`${mockBaseUrl}/user`, {
      headers: {
        Authorization: `token ${mockToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    expect(user).toEqual({
      login: 'mockLogin',
      email: 'mockEmail@example.com',
    });
  });

  it('should throw an error if the user fetch fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(client.getUser()).rejects.toThrow(
      'Github API error: Not Found',
    );
  });

  it('should fetch emails correctly', async () => {
    const mockEmailsResponse = [
      { email: 'email1@example.com', primary: true, verifeid: true },
      { email: 'email2@example.com', primary: false, verified: false },
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmailsResponse,
    });

    const emails = await client.getEmails();

    expect(fetch).toHaveBeenCalledWith(`${mockBaseUrl}/user/emails`, {
      headers: {
        Authorization: `token ${mockToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    expect(emails).toEqual([
      { email: 'email1@example.com', primary: true },
      { email: 'email2@example.com', primary: false },
    ]);
  });

  it('should throw an error if the emails fetch fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
    });

    await expect(client.getEmails()).rejects.toThrow(
      'Github API error: Unauthorized',
    );
  });
});
