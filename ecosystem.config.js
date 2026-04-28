/**
 * PM2 Ecosystem Configuration for GUNDAM SITE
 * Usage: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: "gundam-site",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: "/path/to/gundam-site",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      // Logging
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Restart policy
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
