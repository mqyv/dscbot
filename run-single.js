#!/usr/bin/env node
/**
 * Lance le bot en instance UNIQUE.
 * Désactive SHARDS/SHARD_COUNT pour forcer 1 connexion.
 */
delete process.env.SHARDS;
delete process.env.SHARD_COUNT;
await import('./src/index.js');
