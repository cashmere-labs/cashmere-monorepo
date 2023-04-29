# Cashmere Mono Repo

This project was generated with [Swarmion](https://github.com/swarmion/swarmion).

## Project structure

- Frontend
  - All Code related to the Next.JS Application (not migrated yet)
- Packages
  - Shared lib's across all modules
- Contracts
  - All the libraries for each services
  - Can be used in the frontend part to get each services types
  - Can be used in the services part to declare the service routes and types
- Services
  - All the AWS Services (handlers and stuff)

## Documentation

Find the Swarmion documentation on [swarmion.dev](https://www.swarmion.dev)

## Commands

These commands have to be run at the root of the project.

- `nvm use`: set the version of node set in `.nvmrc`
- `pnpm install`: install node dependencies in all packages;
- `pnpm package`: compile the common packages;
- `pnpm test`: launch the tests in all packages;
- `pnpm run deploy`: deploy all the end services in order;
- `pnpm generate-service myService`: create a simple service in the repository's structure respecting our guidelines
- `pnpm generate-library myLibrary`: create a simple internal library in the repository's structure respecting our guidelines
- `cd frontend/next-app && pnpm dev`: start the application in development mode with hot-code reloading
