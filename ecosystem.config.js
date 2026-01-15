module.exports = {
  apps: [
    {
      name: 'hctracker',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4029',
      cwd: '/home/hctracker/hctracker',
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
      error_file: '/home/hctracker/logs/hctracker-error.log',
      out_file: '/home/hctracker/logs/hctracker-out.log',
      log_file: '/home/hctracker/logs/hctracker-combined.log',
      time: true,
    },
  ],
}
