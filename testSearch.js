import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:5173');

    // Wait for React to load
    await page.waitForSelector('text=Militares');

    // Go to Militares tab
    await page.click('text=Militares');

    // Wait for the search input
    await page.waitForSelector('input[placeholder="Buscar por nome, SARAM ou posto..."]');

    const startTime = Date.now();

    // Type quickly to test the debounce
    await page.fill('input[placeholder="Buscar por nome, SARAM ou posto..."]', 'S');
    await page.fill('input[placeholder="Buscar por nome, SARAM ou posto..."]', 'Si');
    await page.fill('input[placeholder="Buscar por nome, SARAM ou posto..."]', 'Sil');
    await page.fill('input[placeholder="Buscar por nome, SARAM ou posto..."]', 'Silv');
    await page.fill('input[placeholder="Buscar por nome, SARAM ou posto..."]', 'Silva');

    const endTime = Date.now();
    console.log(`Typing took ${endTime - startTime}ms`);

    // Now wait for debounce to trigger a render
    await page.waitForTimeout(500);

    console.log('Search completed without freezing.');

    await browser.close();
})();
