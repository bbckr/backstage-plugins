import { mockServices } from '@backstage/backend-test-utils';
import { PassThrough } from 'stream';
import { createGitAddAction } from './add';
import nodegit from 'nodegit';

jest.mock('nodegit', () => {
  const Index = {
    addByPath: jest.fn(),
    addAll: jest.fn(),
    write: jest.fn(),
  };
  const Repository = {
    refreshIndex: jest.fn().mockResolvedValue(Index),
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createGitAddAction', () => {
  const mockContext = {
    logger: mockServices.logger.mock() as any,
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
    checkpoint: jest.fn(),
    getInitiatorCredentials: jest.fn(),
  };

  it('should add all files to index', async () => {
    const mockCtx = {
      ...mockContext,
      workspacePath: '.test',
      input: {},
    };

    await createGitAddAction().handler(mockCtx);

    expect(nodegit.Repository.open).toHaveBeenCalledWith(
      `${mockCtx.workspacePath}/./.git`,
    );
    expect(mockCtx.logger.info).toHaveBeenCalledWith(
      'Adding all changes to the index',
    );
  });

  it('should add specified files to index', async () => {
    const mockCtx = {
      ...mockContext,
      workspacePath: '.test',
      input: {
        files: ['my/path/file.txt', 'my/other/path/file.txt'],
      },
    };

    await createGitAddAction().handler(mockCtx);

    expect(nodegit.Repository.open).toHaveBeenCalledWith(
      `${mockCtx.workspacePath}/./.git`,
    );
    expect(mockCtx.logger.info).toHaveBeenCalledWith(
      'Adding file my/path/file.txt to the index',
    );
    expect(mockCtx.logger.info).toHaveBeenCalledWith(
      'Adding file my/other/path/file.txt to the index',
    );
  });
});
