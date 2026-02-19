// Configuration PM2 pour hébergement 24/7
// OBLIGATOIRE: fork ! Le mode cluster = plusieurs réponses.
// script: 'node' + args force le fork (évite le bug PM2 qui affiche cluster)
module.exports = {
  apps: [{
    name: 'dscbot',
    script: 'node',
    args: ['src/index.js'],
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
};
