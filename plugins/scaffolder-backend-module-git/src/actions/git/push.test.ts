import { mockServices } from '@backstage/backend-test-utils';
import { PassThrough } from 'stream';
import { createGitPushAction } from './push';
import nodegit from 'nodegit';
import { ScmIntegrations } from '@backstage/integration';
import { ConfigReader } from '@backstage/config';

jest.mock('nodegit', () => {
  const Remote = {
    url: () => 'https://github.com/bbckr/backstage-plugins.git',
    push: jest.fn(),
  };
  const Config = {
    setString: jest.fn(),
  };
  const Repository = {
    getRemote: jest.fn().mockResolvedValue(Remote),
    getCurrentBranch: jest.fn().mockResolvedValue({
      name: () => 'refs/head/test-branch',
      shorthand: () => 'test-branch',
    }),
    config: jest.fn().mockResolvedValue(Config),
  };
  return {
    Repository: {
      ...Repository,
      open: jest.fn().mockResolvedValue(Repository),
    },
    Cred: {
      userpassPlaintextNew: jest.fn(),
    },
    Remote,
  };
});

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

  it('should push changes', async () => {
    const mockCtx = {
      ...mockContext,
      workspacePath: `.test`,
      input: {},
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

    const action = createGitPushAction({ integrations: mockIntegrations });
    await action.handler(mockCtx);

    // @ts-ignore
    expect(nodegit.Repository.getRemote).toHaveBeenCalledWith('origin');
    expect(mockCtx.logger.info).toHaveBeenCalledWith(
      'Remote found at https://github.com/bbckr/backstage-plugins.git',
    );
    // @ts-ignore
    expect(nodegit.Remote.push).toHaveBeenCalledWith(
      ['refs/head/test-branch:refs/head/test-branch'],
      expect.any(Object),
    );

    expect(nodegit.Cred.userpassPlaintextNew).toHaveBeenCalledWith(
      'oauth2',
      'mocktoken',
    );
  });
});
