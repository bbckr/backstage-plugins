# Local Development

## Installation

#### VSCode Dev Containers

If you have VScode and Docker, the remaining dependencies are baked into the development container environment.

- Follow the installation instructions for the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers#installation)
- Open the repository folder in VSCode
- Choose "Reopen in Container" via the command palette or in the left window pane when selecting the Remote Explorer extension
- Select the Node.js 20.x Container

Once the development container is running, you should be able to run any of the commands defined in the package.json successfully.

#### Linux

```sh
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y git nodejs libkrb5-dev
npm install -g yarn@1.22.22
yarn install
```

## Testing

Run the following command:

```sh
yarn test
```

or if you are using VSCode, you can use the [Jest Extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest) to run the tests directly from the IDE. This comes preloaded in the Dev container.

## Demoing the plugins

Run the following command:

```sh
yarn dev
```

This should startup the local Backstage app with all the plugins loaded.

To view the app, you can navigate to https://localhost:3000.
