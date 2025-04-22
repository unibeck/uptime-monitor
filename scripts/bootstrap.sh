#!/bin/bash

cp .dev.vars.example .dev.vars
cp .env.example .env

# Install dependencies
pnpm i

# Run migrations
pnpm db:setup
