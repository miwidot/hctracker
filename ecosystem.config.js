const HOME = process.env.HOME || '/home/hctracker'

module.exports = {
  apps: [
    {
      name: 'hctracker',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4029',
      cwd: `${HOME}/hctracker`,
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
      error_file: `${HOME}/logs/hctracker-error.log`,
      out_file: `${HOME}/logs/hctracker-out.log`,
      log_file: `${HOME}/logs/hctracker-combined.log`,
      time: true,
    },
  ],
}
