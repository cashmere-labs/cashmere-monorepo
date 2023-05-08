# Cashmere Monorepo

This repository contains a monorepo project for the Cashmere platform, which uses SST for AWS stack management, Pnpm for dependency management, NX for task management, and other tools like Pino, Middy, Prettier, and Vitest.

## Table of Contents

-   [Prerequisites](#prerequisites)
-   [Getting Started](#getting-started)
-   [Libraries](#libraries)
-   [Folder Structure](#folder-structure)
-   [Backend](#backend)
-   [Frontend](#frontend)
-   [Global Considerations](#global-considerations)

### Prerequisites

Before getting started with the Cashmere Monorepo project, ensure that you have the following tools and configurations set up on your development environment:

1. **Node.js**: The project uses a specific Node.js version specified in the `.nvmrc` file. To manage multiple Node.js versions, you can use [NVM (Node Version Manager)](https://github.com/nvm-sh/nvm). Install NVM and then run `nvm install` and `nvm use` to set the correct Node.js version for this project.

2. **AWS CLI**: The project relies on the AWS CLI for managing AWS resources. Install the [AWS CLI](https://aws.amazon.com/cli/) and configure it with your AWS credentials by following the [official AWS CLI documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html).

3. **Pnpm**: The project uses Pnpm for dependency management. Install [Pnpm](https://pnpm.io/) globally on your development environment by following the [official Pnpm installation guide](https://pnpm.io/installation).

4. **NX**: The project utilizes NX for task management. Although it's not required to install NX globally, you can familiarize yourself with NX by reading the [official NX documentation](https://nx.dev/).

Ensure that you have all the prerequisites set up before proceeding with the "Getting Started" section of the README.

## Getting Started

To get started with the project, make sure you have the AWS CLI configured on your computer. Then, follow these steps:

1. Clone the repository.
2. Install dependencies with `pnpm install`.
3. Start the development server with `pnpm dev`.

## Libraries

-   [SST](https://github.com/serverless-stack/serverless-stack): For managing AWS stacks efficiently
-   [Pnpm](https://pnpm.io/): For fast monorepo dependency management
-   [NX](https://nx.dev/): For powerful task management
-   [Pino](https://github.com/pinojs/pino): For logging
-   [Middy](https://github.com/middyjs/middy): For API middleware
-   [Prettier](https://prettier.io/): For code formatting
-   [Vitest](https://github.com/vitest-dev/vitest): For unit testing

## Folder Structure

The project is organized into the following folder structure:

-   `shared`: Shared components between front and back.
-   `backend`: Backend related components.
-   `frontend`: Frontend related components.

### Shared

Contains shared components between front and back, such as:

-   Blockchain ABIs and addresses
-   API routes types and responses

### Backend

Contains backend related components, organized as follows:

-   `core`: Core libraries and configuration for the backend.
-   `blockchain`: Blockchain related components for backend interaction.
-   `services`: Business logic per feature.
-   `functions`: Lambda functions per feature and endpoint group.
-   `database`: Database related components.
-   `cache`: Cache related components.

### Frontend

Contains frontend related components, organized as follows:

-   `web/exchange`: Initial project for migration.
-   Future structure: `frontend/core`, `frontend/components`, etc.

### Global Considerations

When contributing to the Cashmere Monorepo project, it is essential to understand the overall architecture and organization of the code. The project is structured as a monorepo, containing both frontend and backend components with shared resources. The AWS infrastructure is managed using SST, and tasks are executed using NX. This setup allows efficient deployment and management of AWS stacks, making it easier to work with different environments like dev, preprod, and prod.

When writing new code for this project, consider the following guidelines:

1. **Modularity**: Write modular code by organizing your features into separate folders within the `backend` or `frontend` directories. This will help in maintaining a clean and organized codebase.

2. **Stack Independence**: Ensure that each stack is independent and can be managed without impacting others. This will allow for more efficient deployments and updates.

3. **Code Reusability**: Leverage shared components and resources in the `shared` folder whenever possible. This will help reduce code duplication and promote better maintainability.

4. **Consistent Coding Style**: Follow the established coding style, including using Prettier for code formatting and adhering to the linter rules.

5. **Testing**: Write unit tests for your code using the Vitest framework to ensure its reliability and maintainability.

6. **Documentation**: Document your code, including comments and README updates, to help other contributors understand your changes and how they fit into the project.

By adhering to these guidelines, you will contribute to the project's maintainability, scalability, and overall code quality.
