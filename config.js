var path = require('path');

module.exports = {

    port: 8484,
    pfx: path.join('certs', 'localhost', 'client.pfx'),
    passphrase: undefined,

    qps: {
        uri: 'localhost',
        prefix: 'passport'
    },

    redirectUri: 'https://localhost/passport/hub'

};