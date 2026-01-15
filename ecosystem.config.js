module.exports = {
  apps: [
    {
      name: 'hctracker',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4029',
      cwd: '/var/www/hctracker',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4029,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4029,
      },
      error_file: '/var/log/pm2/hctracker-error.log',
      out_file: '/var/log/pm2/hctracker-out.log',
      log_file: '/var/log/pm2/hctracker-combined.log',
      time: true,
    },
  ],
}
