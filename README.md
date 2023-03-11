# Node.js Back-End repository template based on Nix ecosystem

This template provides an environment that is fully reproducible on the other developer's machines and on our servers.

It allows everyone else to have a one-liner to install a set of tools and makes projects run on ALL Linux distributions and MacOS.

The project should serve as a starting point for Node.js backend services, listening to GraphQL and REST API requests. Everything has been already configured for you to get started with the development.

# TODO: Edit the following instructions to set up your project correctly.

- README.md:
  - Adjust title: **PROJECT-NAME Back-End repository with Apollo GraphQL**
  - Adjust description
  - Add information on project usage
- package.json:
  - Set proper name for project: _project-name-backend_
  - Adjust the general parts like description, repository url, author, scripts, etc.
- .env.example:
  - Add all necessary environment variables with relative value placeholder

**After completing all these steps, remove this section from the document**

## Table of contents

- [Development Guidelines](#development-guidelines)
- [Getting started](#getting-started)
- [Usage](#usage)
- [Project's Structure](#projects-structure)
- [Testing](#testing)
- [Release](#release)
- [Information](#information)
- [Support](#support)
- [Boilerplate](#boilerplate)

## Development guidelines

Before getting started with the development, make sure to check out the guide on our [development workflow](https://github.com/codeworks-projects/guide-development).

## Getting started

The following steps will get you everything you need to develop and make the project run on ALL Linux distributions and MacOS.

### 1. Make sure to have [Nix](https://nix.dev/tutorials/install-nix) installed, otherwise intall it with the following command:

```bash
sh <(curl -L https://nixos.org/nix/install)
```

### 2. [Setup direnv](https://nix.dev/tutorials/declarative-and-reproducible-developer-environments.html#direnv-automatically-activating-the-environment-on-directory-change) and automate nix shell reloading with the latest dependencies.

- Make sure to have [direnv](https://direnv.net/) installed.
- Hook it into your shell. For bash, add this line at the end of the `~/.bashrc` file: `eval "$(direnv hook bash)"`. Otherwise, visit https://direnv.net/docs/hook.html
- Run the following command on the top level of the project:

```bash
direnv allow
```

**Note:** it may take a while to download all tools and dependencies.

### 3. Run the following command and configure your local environemnt in the `.env` file:

```bash
cp .env.example .env
```

## Usage

### Configuration

If not else specified in the `.env` file, the _GraphQL_ and _REST API_ servers will start at http://localhost:4000/graphql and http://localhost:4001/api/v1, respectively.

Configure `.env` for database connection and setting of additional credentials and secrets.

### Development Tools

Everything is already set up for you, by following the 3-step [Getting Started](#getting-started) section.

If you need to add other development tools, **DO NOT** install them on your local machine! Follow to the [Nix](https://nix.dev) syntax to add new tools, by inserting them in the `buildInputs` list.

### That's it!

Run your application with:

- `yarn start` to build and start the application as in production.
- `yarn dev` to activate the Graphql playground and return mock data when it is missing for GraphQL queries.
- `yarn dev:mock` to activate the development mode and return mock data for the whole GraphQL schema. This is specially useful if you want to start the project without setting up a database.

_Tip: To use authentication and authorization on playground, enable `Include cookies` on Sandbox settings._

_Tip 2: To avoid filling up your terminal with useless logs, when using the playground, disable `Auto Update` in the Sandbox settings (Note: documentation on playground will not be refreshed on hot-reload)._

_Tip 3: GraphQL subscriptions are available on the playground, configuring the endpoint to `ws://localhost:4000/graphql` and the implementation to `graphql-ws`. You can test the susbcription `testNumberIncrement`, which should return sequential numbers every second. If it does not run, try out a different browser or contact the team._

Read also about the [project's structure](#projects-structure), [testing](#testing), and [release](#release).

## Project's Structure

This project is structured on 3 layers:

### API layer

The API layer includes GraphQL resolvers and handlers for REST endpoints, including also the necessary user authentication.

- `graphql/` includes middleware functions for logging and authentication, all the schema specification for types, inputs, queries and mutations, and all the resolvers. <br>
  Specification for the schema and implementation of resolvers should be divided into folders, based on the function they have on the whole system.

- `rest-api/` includes routers and functions for different types of REST APIs and webhooks.

### Service Layer

The service layer contains the business logic of the application, including more complex authorization operations.

Different services are divided into folders, based on the function they have on the whole system. This makes the whole system scalable, organized, and modular.

Furthermore, `services/` also includes a folder for the integrations with other external systems, e.g. email services, videocalling, payments, etc.

### Data Access Layer

Communication with the database happens in the data access layer.

Everything is managed by a singleton Database Connection Manager (_DBConnection_), which deals with the setup of the database schema, based on the specified models in the `data-access/models/` folder, and of a pool of connections on startup.

### Pub/Sub

The system also implements a pub/sub layer to handle actions that are not directly connected to the task performed by a function, e.g. notifying users, creating a change history, etc.

All subscribers are included in the `events/subscribers` folder.

To emit an event from one of the services (payment, in the example), use the following syntax:

```javascript
emitter.emit(events.PAYMENT_UPDATED, {
  service: "payment",
  data: {
    payment,
  },
});
```

### CronJob task handler

To execute repetive tasks, without the need of manual intervention, the system uses a cronjob task manager: `src/cron.ts`

## Testing

Testing is performed through the [Jest Testing Framework](https://jestjs.io/) and in the `src/__tests__/` folder. Simply, use one of the following commands to run tests that have been written:

- `yarn test`
- `yarn test:dev` to enable hot-reloading.

Mock integrations with external systems with `jest.spyOn().mockImplementation()`; multiple examples can be found in the existing test suites.

To test the backend, it is usually sufficient to write integration tests for the GraphQL layer, as a user would interact through a browser client.

### Coverage

To get an overview of what has been tested, run `yarn test:coverage` and then open [`coverage/lcov-report/index.html`](coverage/lcov-report/index.html) on the browser to see the results and what can be improved.
Coverage should be **above 85%** for all relevant functions.

## Release

Before creating a release:

- make sure that [testing](#testing) has been performed correctly (_Tip:_ run `LOG_LEVEL=fatal yarn test` to see the results, without the noise of logs);

- run `yarn test:coverage` to make sure all tests succeed and the minimum coverage of 85% is met;

- create a migration from the old database to the new one (Check out this documentation [here](https://sequelize.org/docs/v6/other-topics/migrations/);

- create a PR from `development` to `main` to visualize the changes that will be applied.

To create a release, from the `development` branch run:

```
$ yarn release
$ git push --follow-tags
```

#### Specific releases can be generated with:

- `yarn release -- --release-as minor` (increments the minor version)
- `yarn release -- --release-as patch` (increments the patch version)
- `yarn release -- --release-as alpha-1.1.0` (specific version)

This commands will take care of incrementing the version number, tagging the commit, and generating a changelog, based on the commit messages.

After a release has been created, it should be merged to the base branch with the following command from `main`:

```
git merge development --squash
```

The commit message should be the original `chore(release)` from development.

All these steps will ensure readability of the changes, simple but robust structure of the repository, and easy restoration of previous versions.

## Information

### About the project's ecosystem

This is a [Node.js](https://nodejs.org/en/) project, which is still a hybrid between JavaScript (for the graphql resolvers and api router functions) and Typescript, with [Apollo](https://www.apollographql.com/docs/apollo-server/) as _GraphQL_ framework, which enables interaction with the frontend. Instead, integration for external software should be available via _REST APIs_, using [Express](http://expressjs.com/).

_Note: If you have some spare time to upgrade also the remaining `.js` files to `.ts`, you are very welcome to do so (please, update the boilerplate as well). Just make sure that everything still runs properly after this operation :)_

For interaction with the database, the project uses [sequelize](https://sequelize.org/docs/v6/).

For logging information efficiently and with a low overhead, the project uses [pino](https://getpino.io/#/?id=low-overhead).

The ecosystem is based on [nix.dev](https://nix.dev) tutorials and the repository gets you started with [Nix](https://nixos.org/):

- [niv](https://github.com/nmattia/niv) for painless dependency management (aka pinning) with a weekly cronjob to bump dependencies
- [direnv](https://direnv.net/) for automatically loading your developer environment
- [gitignore.nix](https://github.com/hercules-ci/gitignore.nix) for respecting `.gitignore` when using your project as a source
- [pre-commit-hooks.nix](https://github.com/cachix/pre-commit-hooks.nix) for running linters (defaults to `shellcheck`, `nix-linter` and `nixpkgs-fmt`) when committing and on the CI
- [commitizen](https://github.com/commitizen/cz-cli) for writing commits in the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard. Having a convention on your commits makes it possible to parse them and use them for generating automatically the version or a [changelog](https://github.com/conventional-changelog/conventional-changelog)
- [standard-version](https://github.com/conventional-changelog/standard-version), utility for versioning using [Semantic Versioning](https://semver.org/) and CHANGELOG generation powered by Conventional Commits
- [GitHub Actions](https://github.com/features/actions) for CI with [dependabot](https://dependabot.com/) automatically bumping GitHub Actions versions

### Support

For support, please contact [hello@decandido.dev](mailto:hello@decandido.dev).

### Boilerplate

The project uses this boilerplate: https://github.com/lelebus/template-backend-nodejs
