import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import nodegit from 'nodegit';
import { z } from 'zod';
import {
  GithubIntegration,
  GitLabIntegration,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import {
  getIntegration,
  getCredentialsCallback,
  commitOutputSchema,
  toShortCommit,
  UserInfo,
} from './utils';
import { initScmIntegrationClient } from '../../integration';

export function createGitCloneAction(options: {
  integrations: ScmIntegrationRegistry;
}) {
  const inputSchema = z.object({
    repositoryUrl: z
      .string()
      .url()
      .describe('The URL of the repository to clone'),
    repositoryConfig: z
      .object({
        userName: z.string().describe('The username to use for the repository'),
        email: z
          .string()
          .email()
          .describe('The email to use for the repository'),
      })
      .optional()
      .describe(
        'The local git configuration for the repository. If not provided, the user info associated to the matched integration token will be used',
      ),
    workingDirectory: z
      .string()
      .optional()
      .default('.')
      .describe('The directory to clone the repository into'),
  });

  const outputSchema = z.object({
    head: commitOutputSchema,
    defaultBranch: z.string().describe('The default branch of the repository'),
  });

  return createTemplateAction<{
    repositoryUrl: string;
    repositoryConfig?: {
      userName: string;
      email: string;
    };
    workingDirectory?: string;
  }>({
    id: 'git:clone',
    description: 'Clone a git repository',
    schema: {
      input: inputSchema,
      output: outputSchema,
    },
    async handler(ctx) {
      const input = inputSchema.safeParse(ctx.input);
      if (!input.success) {
        throw new Error(
          `Invalid input: ${Object.keys(input.error.flatten().fieldErrors)}`,
        );
      }

      const integration = getIntegration(
        input.data.repositoryUrl,
        options.integrations,
      );
      const cloneOptions: nodegit.CloneOptions = {
        fetchOpts: {
          callbacks: {
            credentials: getCredentialsCallback(integration),
          },
        },
      };

      const localPath = resolveSafeChildPath(
        ctx.workspacePath,
        input.data.workingDirectory,
      );

      ctx.logger.info(`Cloning repository to ${localPath}`);

      const repository = await nodegit.Clone(
        input.data.repositoryUrl,
        localPath,
        cloneOptions,
      );

      // Setup local git config
      const gitUserInfo = await setupGitConfig(
        repository,
        integration,
        input.data.repositoryConfig,
      );
      ctx.logger.info(
        `Git config set with '${gitUserInfo.userName} <${gitUserInfo.email}>'`,
      );

      // Get branch details for output
      const head = await repository.getHeadCommit();
      const defaultBranch = await repository.getCurrentBranch();

      const shortCommit = toShortCommit(head);
      ctx.output('head', shortCommit);

      const defaultBranchName = defaultBranch.shorthand();
      ctx.output('defaultBranch', defaultBranchName);

      ctx.logger.info(
        `Cloned default branch ${defaultBranchName} at ${shortCommit.sha}`,
      );
    },
  });
}

async function setupGitConfig(
  repository: nodegit.Repository,
  integration: GitLabIntegration | GithubIntegration | undefined,
  repositoryConfig: UserInfo | undefined,
): Promise<UserInfo> {
  let gitUserName = repositoryConfig?.userName;
  let gitUserEmail = repositoryConfig?.email;

  const gitConfig = await repository.config();

  // if a repository config was not provided, try to look into the user info
  // associated with the token used in the integration
  if (!repositoryConfig && integration) {
    const client = initScmIntegrationClient(integration);
    const userInfo = await client.getUserInfo();
    gitUserName = userInfo.userName;
    gitUserEmail = userInfo.email;
  }

  if (!gitUserName || !gitUserEmail) {
    throw new Error('No git user info found');
  }

  await gitConfig.setString('user.name', gitUserName);

  await gitConfig.setString('user.email', gitUserEmail);

  return {
    userName: gitUserName,
    email: gitUserEmail,
  };
}
