# HTTPS Setup for Network Access

## Why HTTPS is Required

Modern browsers require a **secure context (HTTPS)** for accessing camera and microphone via the `getUserMedia()` API when the application is accessed from a non-localhost address (e.g., `http://192.168.x.x:3000`).

- ✅ **Localhost**: Works with HTTP (`http://localhost:3000`)
- ❌ **Network IP**: Requires HTTPS (`https://192.168.x.x:3000`)

## Quick Solutions

### Option 1: Use ngrok (Easiest - Recommended for Testing)

[ngrok](https://ngrok.com/) creates a secure HTTPS tunnel to your local server.

**Steps:**

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or use chocolatey on Windows:
   choco install ngrok
   ```

2. **Start your application:**
   ```bash
   start.bat
   ```

3. **Create HTTPS tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Access via ngrok URL:**
   - ngrok will provide an HTTPS URL like: `https://abc123.ngrok.io`
   - Share this URL with other devices on your network
   - Camera/microphone permissions will work!

**Pros:** No configuration needed, automatic HTTPS, works anywhere  
**Cons:** URL changes each time (free tier), requires internet connection

---

### Option 2: Self-Signed Certificate (Local Network Only)

Generate a self-signed SSL certificate for your local development server.

**Steps:**

1. **Generate certificate:**
   ```bash
   # Using OpenSSL (install via chocolatey: choco install openssl)
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

2. **Create `server.js` in frontend directory:**
   ```javascript
   const { createServer } = require('https');
   const { parse } = require('url');
   const next = require('next');
   const fs = require('fs');

   const dev = process.env.NODE_ENV !== 'production';
   const app = next({ dev });
   const handle = app.getRequestHandler();

   const httpsOptions = {
     key: fs.readFileSync('./key.pem'),
     cert: fs.readFileSync('./cert.pem')
   };

   app.prepare().then(() => {
     createServer(httpsOptions, (req, res) => {
       const parsedUrl = parse(req.url, true);
       handle(req, res, parsedUrl);
     }).listen(3000, (err) => {
       if (err) throw err;
       console.log('> Ready on https://localhost:3000');
     });
   });
   ```

3. **Update `package.json` scripts:**
   ```json
   {
     "scripts": {
       "dev": "node server.js",
       "dev:http": "next dev"
     }
   }
   ```

4. **Trust the certificate:**
   - Chrome: Navigate to `https://localhost:3000`, click "Advanced" → "Proceed to localhost (unsafe)"
   - Or add certificate to Windows Trusted Root Certification Authorities

**Pros:** Works offline, full control  
**Cons:** Browser warnings, manual certificate trust, more setup

---

### Option 3: Production Setup

For production deployment, use proper SSL certificates:

- **Vercel/Netlify**: Automatic HTTPS
- **Custom Server**: Use [Let's Encrypt](https://letsencrypt.org/) (free SSL certificates)
- **Cloudflare**: Free SSL proxy

---

## Testing After HTTPS Setup

1. **Localhost (HTTP):**
   ```
   http://localhost:3000/interview
   ```
   Should work without HTTPS

2. **Network (HTTPS required):**
   ```
   https://your-ip:3000/interview
   OR
   https://your-ngrok-url.ngrok.io/interview
   ```
   Camera and microphone permissions should now be requested!

---

## Troubleshooting

### "Camera/microphone access is not supported"
- Ensure you're using HTTPS on network access
- Check browser console for specific errors

### "NotAllowedError"
- User denied permissions
- Ask user to grant permissions in browser settings

### Certificate warnings with self-signed certs
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed" in browser
- Or add certificate to system trust store

---

## Recommended Approach

**For Development/Testing:** Use **ngrok** (Option 1)  
**For Production:** Use **Vercel/Netlify** or **Let's Encrypt** (Option 3)
