module.exports = {
    apps: [
        {
            name: 'kvarow_server',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            }, 
        },
    ],
}; 