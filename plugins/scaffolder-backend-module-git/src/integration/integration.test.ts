import { initScmIntegrationClient } from '.';
import { GithubIntegration, ScmIntegrations } from '@backstage/integration';
import { GithubIntegrationClient } from './github';
import { GitLabIntegrationClient } from './gitlab';
import { ConfigReader } from '@backstage/config';

describe('initScmIntegrationClient', () => {
  it('should initialize GithubIntegrationClient for Github integration', () => {
    const mockConfig = new ConfigReader({
      integrations: {
        github: [
          {
            host: 'github.com',
            token: 'mocktoken',
          },
        ],
      },
    });
    const mockIntegrations = ScmIntegrations.fromConfig(mockConfig);
    const mockIntegration = mockIntegrations.github.byHost('github.com');
    const client = initScmIntegrationClient(mockIntegration!);

    expect(client).toBeInstanceOf(GithubIntegrationClient);
    expect(client).toBeTruthy();
  });

  it('should initialize GitLabIntegrationClient for GitLab integration', () => {
    const mockConfig = new ConfigReader({
      integrations: {
        gitlab: [
          {
            host: 'gitlab.com',
            token: 'mocktoken',
          },
        ],
      },
    });
    const mockIntegrations = ScmIntegrations.fromConfig(mockConfig);
    const mockIntegration = mockIntegrations.gitlab.byHost('gitlab.com');
    const client = initScmIntegrationClient(mockIntegration!);

    expect(client).toBeInstanceOf(GitLabIntegrationClient);
    expect(client).toBeTruthy();
  });

  it('should throw error if no token is provided', () => {
    const invalidIntegration = {
      config: {
        apiBaseUrl: 'https://api.github.com',
      },
    } as unknown as GithubIntegration;

    expect(() => initScmIntegrationClient(invalidIntegration)).toThrow(
      'No token provided',
    );
  });

  it('should throw error if no API base URL is provided', () => {
    const invalidIntegration = {
      config: {
        token: 'some-token',
      },
    } as unknown as GithubIntegration;

    expect(() => initScmIntegrationClient(invalidIntegration)).toThrow(
      'No API base URL provided',
    );
  });
});
