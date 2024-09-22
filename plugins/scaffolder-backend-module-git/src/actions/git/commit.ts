import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import nodegit from 'nodegit';
import { z } from 'zod';
import { commitOutputSchema, toShortCommit } from './utils';

export function createGitCommitAction() {
  const inputSchema = z.object({
    message: z.string().describe('The message of the commit'),
    author: z
      .object({
        name: z.string().describe('The name of the author'),
        email: z.string().email().describe('The email of the author'),
      })
      .optional()
      .describe(
        'The author of the commit, defaults to git config set in clone action',
      ),
    committer: z
      .object({
        name: z.string().describe('The name of the committer'),
        email: z.string().email().describe('The email of the committer'),
      })
      .optional()
      .describe(
        'The committer of the commit, defaults to git config set in clone action',
      ),
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
    message: string;
    author?: {
      name: string;
      email: string;
    };
    committer?: {
      name: string;
      email: string;
    };
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

      const localPath = resolveSafeChildPath(
        resolveSafeChildPath(ctx.workspacePath, input.data.workingDirectory),
        '.git',
      );

      const repository = await nodegit.Repository.open(localPath);

      // Setup committer and author
      // Default to whats set in git config
      const config = await repository.config();
      const userName = (await config.getStringBuf('user.name')).toString();
      const userEmail = (await config.getStringBuf('user.email')).toString();

      let author = nodegit.Signature.now(userName, userEmail);
      if (input.data.author) {
        author = nodegit.Signature.now(
          input.data.author.name,
          input.data.author.email,
        );
      }
      ctx.logger.info(`Using author ${author.name()} <${author.email()}>`);

      let committer = nodegit.Signature.now(userName, userEmail);
      if (input.data.committer) {
        committer = nodegit.Signature.now(
          input.data.committer.name,
          input.data.committer.email,
        );
      }
      ctx.logger.info(
        `Using committer ${committer.name()} <${committer.email()}>`,
      );

      // Commit changes
      const index = await repository.refreshIndex();
      const oid = await index.writeTree();
      const parent = await repository.getHeadCommit();
      await repository.createCommit(
        'HEAD',
        author,
        committer,
        input.data.message,
        oid,
        [parent],
      );
      const head = await repository.getHeadCommit();
      ctx.output('head', toShortCommit(head));
    },
  });
}
