import { mockServices } from '@backstage/backend-test-utils';
import { PassThrough } from 'stream';
import { createGitCloneAction } from './clone';
import nodegit from 'nodegit';
import { ScmIntegrations } from '@backstage/integration';
import { ConfigReader } from '@backstage/config';

jest.mock('../../integration', () => {
  return {
    initScmIntegrationClient: jest.fn().mockReturnValue({
      getUserInfo: jest.fn().mockResolvedValue({
        userName: 'Backstage Scaffolder',
        email: 'scaffolder@backstage.io',
      }),
    }),
  };
});

jest.mock('nodegit', () => {
  const Config = {
    setString: jest.fn(),
  };
  const Repository = {
    getHeadCommit: jest.fn().mockResolvedValue({
      sha: () => 'mocksha',
      author: () => ({
        name: () => 'mockauthor',
        email: () => 'author@mock.com',
      }),
      committer: () => ({
        name: () => 'mockcommitter',
        email: () => 'committer@mock.com',
      }),
      date: () => new Date('2024-01-01'),
      message: () => 'mockmessage',
    }),
    getCurrentBranch: jest.fn().mockResolvedValue({
      shorthand: () => 'main',
    }),
    config: jest.fn().mockResolvedValue(Config),
  };
  const Clone = jest.fn().mockResolvedValue(Repository);
  return {
    Clone,
    Cred: {
      userpassPlaintextNew: jest.fn(),
    },
  };
});

jest.mock('');

afterEach(() => {
  jest.clearAllMocks();
});

describe('createGitCloneAction', () => {
  const mockContext = {
    logger: mockServices.logger.mock() as any,
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
    checkpoint: jest.fn(),
    getInitiatorCredentials: jest.fn(),
  };

  it('should clone repository', async () => {
    const mockCtx = {
      ...mockContext,
      workspacePath: '.test',
      input: {
        repositoryUrl: 'https://github.com/bbckr/backstage-plugins.git',
      },
    };

    const mockConfig = new ConfigReader({
      integrations: {
        github: [
          {
            host: 'github.com',
            token: 'mocktoken',
          },
        ],
      },
    });
    const mockIntegrations = ScmIntegrations.fromConfig(mockConfig);

    const action = createGitCloneAction({ integrations: mockIntegrations });
    await action.handler(mockCtx);

    expect(mockCtx.logger.info).toHaveBeenCalledWith(
      "Git config set with 'Backstage Scaffolder <scaffolder@backstage.io>'",
    );

    expect(mockCtx.output).toHaveBeenCalledTimes(2);
    expect(mockCtx.output).toHaveBeenNthCalledWith(1, 'head', {
      sha: 'mocksha',
      message: 'mockmessage',
      author: { name: 'mockauthor', email: 'author@mock.com' },
      committer: { name: 'mockcommitter', email: 'committer@mock.com' },
      date: '2024-01-01T00:00:00.000Z',
    });
    expect(mockCtx.output).toHaveBeenNthCalledWith(2, 'defaultBranch', 'main');
    expect(nodegit.Clone).toHaveBeenCalledWith(
      mockCtx.input.repositoryUrl,
      expect.stringContaining(mockCtx.workspacePath),
      expect.any(Object),
    );
    expect(nodegit.Cred.userpassPlaintextNew).toHaveBeenCalledWith(
      'oauth2',
      'mocktoken',
    );
  });
});
