module.exports = {
  apps: [
    {
      name: 'ocean-admin-panel',
      cwd: '/opt/ocean/admin-panel',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3100
      },
      error_file: '/var/log/pm2/ocean-admin-panel-error.log',
      out_file: '/var/log/pm2/ocean-admin-panel-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'ocean-auth-service',
      cwd: '/opt/ocean/auth-service',
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3200
      },
      error_file: '/var/log/pm2/ocean-auth-service-error.log',
      out_file: '/var/log/pm2/ocean-auth-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'ocean-ocoder',
      cwd: '/opt/ocean/external/autonomous-coding-ui',
      script: 'start_ui.py',
      interpreter: 'python3',
      env: {
        NODE_ENV: 'production',
        PORT: 8888
      },
      error_file: '/var/log/pm2/ocean-ocoder-error.log',
      out_file: '/var/log/pm2/ocean-ocoder-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G'
    }
  ]
};
