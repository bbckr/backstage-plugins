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

export function createGitCommitAction() {
  const inputSchema = z.object({
    workingDirectory: z
      .string()
      .optional()
      .default('.')
      .describe('The directory to clone the repository into'),
  });

  const outputSchema = z.object({
    head: commitOutputSchema,
  });

  return createTemplateAction<{
    workingDirectory?: string;
  }>({
    id: 'git:commit',
    description: 'Commit changes to a git repository',
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

      // TODO: Implement git commit action
    },
  });
}
