import { GithubIntegrationClient } from '.';
import { GithubHttpClient } from './http';
import { UserInfo } from '../actions/git/utils';

const mockGithubHttpClient = {
  getUser: jest.fn(),
  getEmails: jest.fn(),
};

describe('GithubIntegrationClient', () => {
  let client: GithubIntegrationClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new GithubIntegrationClient(
      mockGithubHttpClient as unknown as GithubHttpClient,
    );
  });

  it('should fetch user info', async () => {
    const mockUser = { login: 'mockUser', email: 'mock@email.com' };
    const mockEmails = [
      { email: 'email1@example.com', primary: false },
      { email: 'email2@example.com', primary: true },
    ];

    mockGithubHttpClient.getUser.mockResolvedValueOnce(mockUser);
    mockGithubHttpClient.getEmails.mockResolvedValueOnce(mockEmails);

    const userInfo: UserInfo = await client.getUserInfo();

    expect(mockGithubHttpClient.getUser).toHaveBeenCalledTimes(1);
    expect(mockGithubHttpClient.getEmails).toHaveBeenCalledTimes(0);
    expect(userInfo).toEqual({ userName: 'mockUser', email: 'mock@email.com' });
  });

  it('should fetch user info with primary email', async () => {
    const mockUser = { login: 'mockUser', email: null };
    const mockEmails = [
      { email: 'email1@example.com', primary: false },
      { email: 'email2@example.com', primary: true },
    ];

    mockGithubHttpClient.getUser.mockResolvedValueOnce(mockUser);
    mockGithubHttpClient.getEmails.mockResolvedValueOnce(mockEmails);

    const userInfo: UserInfo = await client.getUserInfo();

    expect(mockGithubHttpClient.getUser).toHaveBeenCalledTimes(1);
    expect(mockGithubHttpClient.getEmails).toHaveBeenCalledTimes(1);
    expect(userInfo).toEqual({
      userName: 'mockUser',
      email: 'email2@example.com',
    });
  });
});
