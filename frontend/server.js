const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const os = require('os');

// Function to get all local IPv4 addresses
function getNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({ name, address: iface.address });
            }
        }
    }

    return addresses;
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
    key: fs.readFileSync('./cert.key'),
    cert: fs.readFileSync('./cert.crt')
};

app.prepare().then(() => {
    createServer(httpsOptions, async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('Internal server error');
        }
    }).listen(port, hostname, (err) => {
        if (err) throw err;
        console.log(`\n> Ready on https://localhost:${port}`);

        const networkAddresses = getNetworkAddresses();
        if (networkAddresses.length > 0) {
            console.log(`\n> Also available on your network:`);
            networkAddresses.forEach(({ name, address }) => {
                console.log(`  - https://${address}:${port} (${name})`);
            });
        }

        console.log(`\n> Note: You may need to accept the self-signed certificate in your browser`);
        console.log(`\n> To find your IP address manually, run: ipconfig (Windows) or ifconfig (Mac/Linux)\n`);
    });
});
