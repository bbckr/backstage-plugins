import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import * as actions from './actions';
import { ScmIntegrations } from '@backstage/integration';

export const scaffolderModule = createBackendModule({
  moduleId: 'bbckr-scaffolder-backend-module-git',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ scaffolderActions, config }) {
        const integrations = ScmIntegrations.fromConfig(config);

        scaffolderActions.addActions(
          actions.createGitCloneAction({ integrations }),
          actions.createGitCheckoutAction(),
        );
      },
    });
  },
});
