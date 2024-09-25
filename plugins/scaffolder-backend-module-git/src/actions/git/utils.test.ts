import { ConfigReader } from '@backstage/config';
import { getIntegration, parseHostFromUrl } from './utils';
import { ScmIntegrations } from '@backstage/integration';

describe('parseHostFromUrl', () => {
  it('should parse host from url', () => {
    const url = 'https://github.com/bbckr/backstage-plugins.git';
    const host = parseHostFromUrl(url);
    expect(host).toEqual('github.com');
  });
});

describe('getToken', () => {
  it('should get token from integrations for github', () => {
    const repositoryUrl = 'https://github.com/bbckr/backstage-plugins.git';
    const configReader = new ConfigReader({
      integrations: {
        github: [
          {
            host: 'bbckr.github.com',
            token: 'mocktoken2',
          },
          {
            host: 'github.com',
            token: 'mocktoken',
          },
        ],
      },
    });
    const integrations = ScmIntegrations.fromConfig(configReader);

    const integration = getIntegration(repositoryUrl, integrations);
    expect(integration?.config).toEqual({
      host: 'github.com',
      token: 'mocktoken',
      rawBaseUrl: 'https://raw.githubusercontent.com',
      apiBaseUrl: 'https://api.github.com',
      apps: undefined,
    });
  });

  it('should get token from integrations for gitlab', () => {
    const repositoryUrl = 'https://gitlab.com/bbckr/backstage-plugins.git';
    const configReader = new ConfigReader({
      integrations: {
        github: [
          {
            host: 'github.com',
            token: 'mocktoken3',
          },
        ],
        gitlab: [
          {
            host: 'gitlab.com',
            token: 'mocktoken5',
          },
        ],
      },
    });
    const integrations = ScmIntegrations.fromConfig(configReader);

    const integration = getIntegration(repositoryUrl, integrations);
    expect(integration?.config).toEqual({
      host: 'gitlab.com',
      token: 'mocktoken5',
      apiBaseUrl: 'https://gitlab.com/api/v4',
      baseUrl: 'https://gitlab.com',
    });
  });
});
