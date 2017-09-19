module.exports = {
    jira: {
        provider: {
            protocol: 'oauth',
            signatureMethod: 'RSA-SHA1',
            temporary: 'https://yaht.atlassian.net/plugins/servlet/oauth/request-token',
            auth: 'https://yaht.atlassian.net/plugins/servlet/oauth/authorize',
            token: 'https://yaht.atlassian.net/plugins/servlet/oauth/access-token'
        },
        cookie: 'jira',
        isSecure: false, // Should be set to true (which is the default) in production
        password: '9d0b9f5f-92fe-43c1-9e8b-af465382efd4', // Use something more secure in production
        clientId: 'secret_jira_encryption_password',      // Use something more secure in production
        clientSecret: ``
    }
};
