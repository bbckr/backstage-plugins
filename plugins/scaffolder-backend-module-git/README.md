# Scaffolder Backend Git Module

![npm version](https://img.shields.io/npm/v/@bbckr/backstage-plugin-scaffolder-backend-module-git) ![license](https://img.shields.io/npm/l/@bbckr/backstage-plugin-scaffolder-backend-module-git) ![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/bbckr/backstage-plugins/build.yml?branch=main)

This plugin allows you to use Git operations such as cloning, committing, and pushing directly from your scaffolder workflows.

An example template can be found [here](examples/software-templates/demo-scaffolder-backend-module-git.yaml).

## Installation

In the repository root of your Backstage project, run:

```sh
yarn add --cwd packages/backend @seatgeek/backstage-plugin-scaffolder-backend-module-hcl
```

Lastly, import the package into the backend:

```js
// packages/backend/src/index.ts
const backend = createBackend();

backend.add(import('@bbckr/backstage-plugin-scaffolder-backend-module-git'));
```

Now the actions should be registed, and you can use them in your software templates.

## Actions

Here’s an overview of the available actions in the Scaffolder Backend Git Module along with details on the inputs, and whether they are required or optional:

### `git:clone`

Clones a Git repository into the scaffolder workspace. If no repository config is set, defaults to the default Backstage Scaffolder git config.

```yaml
spec:
  steps:
    - id: clone
      name: Clone a Git Repository
      action: git:clone
      input:
        repositoryUrl: https://github.com/my-org/my-repo.git # required
        # repositoryConfig: # optional
        #   userName: John Doe
        #   email: john@doe.com
        # workingDirectory: '.' # optional, relative to the scaffolder workspace path
```

### `git:checkout`

Checkout a new or existing branch in the Git repository and switch to it.

```yaml
spec:
  steps:
    - id: checkout
      name: Checkout the branch
      action: git:checkout
      input:
        branchName: 'my-new-branch' # required
        shouldCreate: true # optional
        # strategy: 'safe' # optional
        # workingDirectory: '.' # optional, relative to the scaffolder workspace path
```

### `git:add`

Add all or a subset of files to the Git repository index.

```yaml
spec:
  steps:
    - id: add
      name: Add changes to the index
      action: git:add
      # input:
      #   files: [] # optional, omit to add all
      #   workingDirectory: '.' # optional, relative to the scaffolder workspace path
```

### `git:commit`

Commit the changes. The author and committer defaults to what is set in the repository config on clone.

```yaml
spec:
  steps:
    - id: commit
      name: Commit changes
      action: git:commit
      input:
        message: 'demo: test commit action in demo template'
        # author:
        #   name: ''
        #   email: ''
        # committer:
        #   name: ''
        #   email: ''
```

### `git:push`

Push the changes to a remote branch. If the remote branch does not exist, this gets created.

```yaml
spec:
  steps:
    - id: push
      name: Push changes to the remote repository
      action: git:push
      # input:
      #   remote: 'origin' # optional, defaults to origin
      #   branch: 'my-new-branch' # optional, defaults to the current branch
      #   workingDirectory: '.' # optional, relative to the scaffolder workspace path
```
