module.exports = {
    yaht: {
        cookie: 'yaht',
        isSecure: false, // False allows insecure (http) connections. Change in production when we have https.
        password: '9d0b9f5f-92fe-43c1-9e8b-af465382efd4' // Use something more secure in production
    },
    default: {
        clearInvalid: true, // Remove invalid cookies
        encoding: 'iron',   // Encrypts and sign the value using iron
        isSecure: false,    // False allows insecure (http) connections. Change in production when we have https.
        password: '9d0b9f5f-92fe-43c1-9e8b-af465382efd4', // Use something more secure in production
        strictHeader: true, // Don't allow violations of RFC 6265
        ttl: null           // Session time-life - cookies are deleted when the browser is closed
    }
};
