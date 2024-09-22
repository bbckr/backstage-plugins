import { z } from 'zod';
import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import nodegit from 'nodegit';

export function createGitAddAction() {
  const inputSchema = z.object({
    files: z
      .string()
      .array()
      .optional()
      .describe(
        'The changed files to add to the git index, omit to add all changes',
      ),
    workingDirectory: z
      .string()
      .optional()
      .default('.')
      .describe('The directory to clone the repository into'),
  });

  return createTemplateAction<{
    files?: string[];
    workingDirectory?: string;
  }>({
    id: 'git:add',
    description: 'Add files to the git index',
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

      const index = await repository.refreshIndex();

      if (input.data.files) {
        for (const file of input.data.files) {
          ctx.logger.info(`Adding file ${file} to the index`);
          await index.addByPath(file);
        }
      } else {
        ctx.logger.info('Adding all changes to the index');
        await index.addAll();
      }

      await index.write();
    },
  });
}
