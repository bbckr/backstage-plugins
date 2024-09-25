import { mockServices } from '@backstage/backend-test-utils';
import { PassThrough } from 'stream';
import { createGitCommitAction } from './commit';
import nodegit from 'nodegit';

jest.mock('nodegit', () => {
  const Index = {
    writeTree: jest.fn(),
  };
  const Config = {
    getStringBuf: jest.fn().mockImplementation(key => {
      if (key === 'user.name') {
        return Promise.resolve(Buffer.from('John Doe'));
      }
      if (key === 'user.email') {
        return Promise.resolve(Buffer.from('john@doe.com'));
      }
      return Promise.resolve(Buffer.from('mockvalue'));
    }),
  };
  const Repository = {
    getHeadCommit: jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve({}))
      .mockImplementationOnce(() =>
        Promise.resolve({
          sha: () => 'mocksha',
          author: () => ({
            name: () => 'John Doe',
            email: () => 'john@doe.com',
          }),
          committer: () => ({
            name: () => 'John Doe',
            email: () => 'john@doe.com',
          }),
          date: () => new Date('2024-01-01'),
          message: () => 'mockmessage',
        }),
      ),
    config: jest.fn().mockResolvedValue(Config),
    refreshIndex: jest.fn().mockResolvedValue(Index),
    createCommit: jest.fn(),
  };
  return {
    Repository: {
      ...Repository,
      open: jest.fn().mockResolvedValue(Repository),
    },
    Signature: {
      now: jest.fn().mockImplementation((name, email) => ({
        name: () => name,
        email: () => email,
      })),
    },
  };
});

jest.mock('@backstage/backend-plugin-api', () => ({
  ...jest.requireActual('@backstage/backend-plugin-api'),
  resolveSafeChildPath: jest.fn().mockImplementation((basePath, childPath) => {
    return `${basePath}/${childPath}`;
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createGitCommitAction', () => {
  const mockContext = {
    logger: mockServices.logger.mock() as any,
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
    checkpoint: jest.fn(),
    getInitiatorCredentials: jest.fn(),
  };

  it('should commit changes', async () => {
    const mockCtx = {
      ...mockContext,
      workspacePath: '.test',
      input: {
        message: 'mockmessage',
      },
    };

    await createGitCommitAction().handler(mockCtx);

    expect(nodegit.Repository.open).toHaveBeenCalledWith(
      `${mockCtx.workspacePath}/./.git`,
    );
    expect(mockCtx.logger.info).toHaveBeenCalledWith(
      'Using author John Doe <john@doe.com>',
    );
    expect(mockCtx.logger.info).toHaveBeenCalledWith(
      'Using committer John Doe <john@doe.com>',
    );
    // @ts-ignore
    expect(nodegit.Repository.createCommit).toHaveBeenCalledTimes(1);
    expect(mockCtx.output).toHaveBeenNthCalledWith(1, 'head', {
      sha: 'mocksha',
      author: {
        name: 'John Doe',
        email: 'john@doe.com',
      },
      committer: {
        name: 'John Doe',
        email: 'john@doe.com',
      },
      message: 'mockmessage',
      date: '2024-01-01T00:00:00.000Z',
    });
  });
});
