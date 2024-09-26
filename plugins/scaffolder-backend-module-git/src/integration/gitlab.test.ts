import { GitLabIntegrationClient } from '.';
import { GitLabHttpClient } from './http';
import { UserInfo } from '../actions/git/utils';

const mockGitLabHttpClient = {
  getUser: jest.fn(),
};

describe('GitLabIntegrationClient', () => {
  let client: GitLabIntegrationClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new GitLabIntegrationClient(
      mockGitLabHttpClient as unknown as GitLabHttpClient,
    );
  });

  it('should fetch user info from GitLab', async () => {
    const mockUser = { username: 'mockUser', email: 'mockEmail@example.com' };

    mockGitLabHttpClient.getUser.mockResolvedValueOnce(mockUser);

    const userInfo: UserInfo = await client.getUserInfo();

    expect(mockGitLabHttpClient.getUser).toHaveBeenCalledTimes(1);
    expect(userInfo).toEqual({
      userName: 'mockUser',
      email: 'mockEmail@example.com',
    });
  });
});
