import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import nodegit from 'nodegit';
import { z } from 'zod';

export function createGitPushAction() {
  const inputSchema = z.object({
    workingDirectory: z
      .string()
      .optional()
      .default('.')
      .describe('The directory to clone the repository into'),
  });

  return createTemplateAction<{
    workingDirectory?: string;
  }>({
    id: 'git:push',
    description: 'Push changes to a remote branch',
    schema: {
      input: inputSchema,
    },
    async handler(ctx) {
      const input = inputSchema.safeParse(ctx.input);
      if (!input.success) {
        throw new Error(
          `Invalid input: ${Object.keys(input.error.flatten().fieldErrors)}`,
        );
      }

      const localPath = resolveSafeChildPath(
        resolveSafeChildPath(ctx.workspacePath, input.data.workingDirectory),
        '.git',
      );

      const repository = await nodegit.Repository.open(localPath);
      // TODO: Implement push
    }
  });
}
