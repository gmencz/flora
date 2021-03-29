# Chatskee

## Setup

Follow the instructions in order to set up the project on your machine.

### Install:

1. Do all the usual git stuff...
2. Once the repo is on your machine, go ahead and run `npm install` to install
   all the project's dependencies.

### Environment variables:

1.  Create a `.env.local` file with the placeholder values in
    `.env.local.example`.
2.  Run the script `setup-faunadb.sh` and follow the instructions.
3.  Ask me for the firebase credentials to fill the `.env.local` values.

### Docker:

1.  Start Docker and run `docker-compose up -d` to start the local development
    instance of FaunaDB.
2.  Make sure the FaunaDB instance has started successfully and run
    `npm run fauna:migrate` in a terminal to apply all migrations.

### Start app:

We need to run two processes for our app to work in development, one is the
firebase emulator for authentication and the other one is the next dev server.
Run `npm run firebase` in one terminal and `npm run dev` in another terminal.
