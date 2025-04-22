#!/bin/bash

cp .dev.vars.example .dev.vars
cp .env.example .env

# Install dependencies
pnpm i

# Run migrations
yes | pnpm db:setup
