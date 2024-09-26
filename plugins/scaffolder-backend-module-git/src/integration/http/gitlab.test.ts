import { GitLabHttpClient } from '.'; // Adjust the path as needed

global.fetch = jest.fn();

describe('GitLabHttpClient', () => {
  const mockToken = 'glpat-mock-token';
  const mockBaseUrl = 'https://gitlab.com/api/v4';
  let client: GitLabHttpClient;

  beforeEach(() => {
    client = new GitLabHttpClient(mockToken, mockBaseUrl);
    jest.clearAllMocks();
  });

  it('should fetch user data correctly using Private-Token', async () => {
    const mockUserResponse = {
      username: 'mockUsername',
      email: 'mockEmail@example.com',
      state: 'active',
      locked: false,
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserResponse,
    });

    const user = await client.getUser();

    expect(fetch).toHaveBeenCalledWith(`${mockBaseUrl}/user`, {
      headers: {
        'Private-Token': mockToken,
        Accept: 'application/json',
      },
    });
    expect(user).toEqual({
      username: 'mockUsername',
      email: 'mockEmail@example.com',
    });
  });

  it('should fetch user data correctly using Bearer token', async () => {
    const bearerToken = 'bearer-mock-token';
    client = new GitLabHttpClient(bearerToken, mockBaseUrl);

    const mockUserResponse = {
      username: 'mockUsername',
      email: 'mockEmail@example.com',
      state: 'active',
      locked: false,
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserResponse,
    });

    const user = await client.getUser();

    expect(fetch).toHaveBeenCalledWith(`${mockBaseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: 'application/json',
      },
    });
    expect(user).toEqual({
      username: 'mockUsername',
      email: 'mockEmail@example.com',
    });
  });

  it('should throw an error if the user fetch fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
    });

    await expect(client.getUser()).rejects.toThrow(
      'GitLab API error: Unauthorized',
    );
  });
});
