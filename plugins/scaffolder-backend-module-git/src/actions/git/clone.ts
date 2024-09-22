import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import nodegit from 'nodegit';
import { z } from 'zod';
import { ScmIntegrationRegistry } from '@backstage/integration';
import {
  getToken,
  commitOutputSchema,
  toShortCommit,
  parseHostFromUrl,
} from './utils';

export function createGitCloneAction(options: {
  integrations: ScmIntegrationRegistry;
}) {
  const inputSchema = z.object({
    repositoryUrl: z
      .string()
      .url()
      .describe('The URL of the repository to clone'),
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

      let cloneOptions: nodegit.CloneOptions | undefined = undefined;

      const { integrations } = options;
      const host = parseHostFromUrl(input.data.repositoryUrl);
      const token = getToken(input.data.repositoryUrl, integrations);
      if (token) {
        const creds = nodegit.Cred.userpassPlaintextNew(token, 'x-oauth-basic');
        cloneOptions = {
          fetchOpts: {
            callbacks: {
              credentials: () => {
                return creds;
              },
              certificateCheck: function () {
                return 0;
              },
            },
          },
        };
        ctx.logger.info(`Found token for host ${host}`);
      } else {
        ctx.logger.warn(
          `No token found for host ${host}, check your integration config if this is unexpected`,
        );
      }

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
      const head = await repository.getHeadCommit();
      const defaultBranch = await repository.getCurrentBranch();

      const shortCommit = toShortCommit(head);
      ctx.logger.debug(`Found head commit ${shortCommit}`);
      ctx.output('head', shortCommit);

      const defaultBranchName = defaultBranch.shorthand();
      ctx.logger.debug(`Found default branch ${defaultBranchName}`);
      ctx.output('defaultBranch', defaultBranchName);
    },
  });
}
