import { mockServices } from '@backstage/backend-test-utils';
import { PassThrough } from 'stream';
import { createGitCheckoutAction } from './checkout';
import nodegit from 'nodegit';

jest.mock('nodegit', () => {
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
    createBranch: jest.fn(),
    checkoutBranch: jest.fn(),
  };
  return {
    Repository: {
      ...Repository,
      open: jest.fn().mockResolvedValue(Repository),
    },
  };
});

jest.mock('@backstage/backend-plugin-api', () => ({
  ...jest.requireActual('@backstage/backend-plugin-api'),
  resolveSafeChildPath: jest.fn().mockImplementation((basePath, childPath) => {
    return `${basePath}/${childPath}`;
  }),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('createGitCheckoutAction', () => {
  const mockContext = {
    logger: mockServices.logger.mock() as any,
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
    checkpoint: jest.fn(),
    getInitiatorCredentials: jest.fn(),
  };

  it('should checkout a repository', async () => {
    const mockCtx = {
      ...mockContext,
      workspacePath: '.test',
      input: {
        branchName: 'my-new-branch',
        shouldCreate: true,
      },
    };

    await createGitCheckoutAction().handler(mockCtx);

    expect(nodegit.Repository.open).toHaveBeenCalledWith(
      `${mockCtx.workspacePath}/./.git`,
    );
    // @ts-ignore
    expect(nodegit.Repository.createBranch).toHaveBeenCalledTimes(1);
    // @ts-ignore
    expect(nodegit.Repository.createBranch).toHaveBeenCalledWith(
      'my-new-branch',
      expect.any(Object),
    );
    // @ts-ignore
    expect(nodegit.Repository.checkoutBranch).toHaveBeenCalledWith(
      'my-new-branch',
      { checkoutStrategy: 1 },
    );
    expect(mockCtx.output).toHaveBeenCalledWith('head', {
      sha: 'mocksha',
      message: 'mockmessage',
      author: { name: 'mockauthor', email: 'author@mock.com' },
      committer: { name: 'mockcommitter', email: 'committer@mock.com' },
      date: '2024-01-01T00:00:00.000Z',
    });
  });
});
