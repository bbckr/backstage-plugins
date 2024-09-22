import { z } from 'zod';
import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import nodegit from 'nodegit';
import { commitOutputSchema, toShortCommit } from './utils';

enum CheckoutStrategy {
  NONE = 0,
  SAFE = 1,
  FORCE = 2,
  RECREATE_MISSING = 4,
  ALLOW_CONFLICTS = 16,
}

export function createGitCheckoutAction() {
  const inputSchema = z.object({
    branchName: z.string().describe('The branch to checkout'),
    shouldCreate: z
      .boolean()
      .optional()
      .default(false)
      .describe('Whether to create the branch and switch to it'),
    strategy: z
      .enum(['none', 'safe', 'force', 'recreate_missing', 'allow_conflicts'])
      .optional()
      .default('safe')
      .transform(val => val.toUpperCase() as keyof typeof CheckoutStrategy)
      .describe('The checkout strategy to use'),
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
    branchName: string;
    shouldCreate?: boolean;
    strategy?: string;
    workingDirectory?: string;
  }>({
    id: 'git:checkout',
    description: 'Checkout a git branch',
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

      const localPath = resolveSafeChildPath(
        resolveSafeChildPath(ctx.workspacePath, input.data.workingDirectory),
        '.git',
      );

      const repository = await nodegit.Repository.open(localPath);
      const head = await repository.getHeadCommit();
      if (input.data.shouldCreate) {
        ctx.logger.info(`Creating branch ${input.data.branchName}`);
        await repository.createBranch(input.data.branchName, head);
      }

      ctx.logger.info(`Switching to branch ${input.data.branchName}`);
      const checkoutOptions = {
        checkoutStrategy: CheckoutStrategy[input.data.strategy],
      };
      await repository.checkoutBranch(input.data.branchName, checkoutOptions);

      const shortCommit = toShortCommit(head);
      ctx.output('head', shortCommit);
      ctx.logger.info(
        `Checkout out branch ${input.data.branchName} at ${shortCommit.sha}`,
      );
    },
  });
}
