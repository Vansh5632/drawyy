#!/usr/bin/env node

// This script runs the TypeScript server using ts-node with proper ESM support
require('ts-node/register/transpile-only');
require('./server/index.ts');