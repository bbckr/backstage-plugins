import { ScmIntegrationRegistry } from '@backstage/integration';
import { z } from 'zod';
import nodegit from 'nodegit';

export function parseHostFromUrl(url: string): string {
  const urlObject = new URL(url);
  return urlObject.host;
}

export function getToken(
  repositoryUrl: string,
  integrations: ScmIntegrationRegistry,
): string | undefined {
  const host = parseHostFromUrl(repositoryUrl);
  const integrationConfig =
    integrations.gitlab.byHost(host) ?? integrations.github.byHost(host);

  return integrationConfig?.config.token;
}

export function getCredentialsCallback(
  repositoryUrl: string,
  integrations: ScmIntegrationRegistry,
): Function {
  const token = getToken(repositoryUrl, integrations);
  const creds = token
    ? nodegit.Cred.userpassPlaintextNew(token, 'x-oauth-basic')
    : nodegit.Cred.defaultNew();
  return () => {
    return creds;
  };
}

export function toShortCommit(commit: any) {
  return {
    sha: commit.sha(),
    message: commit.message(),
    author: {
      name: commit.author().name(),
      email: commit.author().email(),
    },
    committer: {
      name: commit.committer().name(),
      email: commit.committer().email(),
    },
    date: commit.date().toISOString(),
  };
}

export const commitOutputSchema = z.object({
  sha: z.string().describe('The SHA of the head commit'),
  message: z.string().describe('The message of the head commit'),
  author: z.object({
    name: z.string().describe('The name of the author'),
    email: z.string().email().describe('The email of the author'),
  }),
  committer: z.object({
    name: z.string().describe('The name of the committer'),
    email: z.string().email().describe('The email of the committer'),
  }),
  date: z
    .date()
    .transform(val => val.toISOString())
    .describe('The date of the commit'),
});
