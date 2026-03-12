import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        let errorCaught = null;
        page.on('pageerror', err => {
            console.log('PAGE_ERROR:', err.toString());
            errorCaught = err.toString();
        });
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('CONSOLE_ERROR:', msg.text());
                // Only log the first major runtime error
                if (msg.text().includes('TypeError') || msg.text().includes('ReferenceError') || msg.text().includes('Error')) {
                   errorCaught = msg.text();
                }
            }
        });

        console.log('Navigating to app...');
        await page.goto('http://localhost:5173/');
        await new Promise(r => setTimeout(r, 2000));
        
        console.log("Looking for links to click...");
        const links = await page.$$('a');
        if (links.length > 0) {
            console.log("Clicking the first link to trigger navigation!");
            await links[0].click();
            await new Promise(r => setTimeout(r, 2000));
        }

        console.log("Done checking.");
        await browser.close();
    } catch (e) {
        console.log("PUPPETEER_SCRIPT_ERROR:", e.message);
    }
})();
