const puppeteer = require('puppeteer');
const genericPool = require('generic-pool');
const cron = require('node-cron');

const factory = {
    create: async () => {
        const browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', 
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        return browser;
    },
    destroy: (browser) => browser.close()
};

const opts = {
    max: 5,
    min: 2, 
    idleTimeoutMillis: 30000, 
    evictionRunIntervalMillis: 15000 
};

const browserPool = genericPool.createPool(factory, opts);

const getss = async (site) => {
    const url = site;
    if (!url) {
        return { message: 'site parameter is required', status: 400 };
    }

    let browser;
    try {
        browser = await browserPool.acquire();
        const page = await browser.newPage();
        
        
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.setViewport({ width: 1200, height: 1000 });
        const screenshot = await page.screenshot({ encoding: 'base64' });
        await page.close();
        browserPool.release(browser); 
        
        return { screenshot, status: 200 };
    } catch (error) {
        if (browser) {
            await browserPool.release(browser);
        }
        return { message: "An error occurred: " + error.message, status: 500 };
    }
};

const monitorMemoryUsage = () => {
    setInterval(() => {
        const memoryUsage = process.memoryUsage();
        console.log(`Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        const cpuUsage = process.cpuUsage();
        console.log(`CPU Usage: User ${(cpuUsage.user / 1000).toFixed(2)} ms, System ${(cpuUsage.system / 1000).toFixed(2)} ms`);
    }, 10000);
};

monitorMemoryUsage();

cron.schedule('0 0 * * *', () => {
    console.log('Performing daily cleanup...');
    browserPool.drain().then(() => browserPool.clear());
});

module.exports = getss;
