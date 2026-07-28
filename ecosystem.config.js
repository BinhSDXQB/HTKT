module.exports = {
  apps: [
    {
      name: 'ql-htkt',
      cwd: 'c:\\Troly\\HTKT\\app',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '500M',
    },
  ],
};
