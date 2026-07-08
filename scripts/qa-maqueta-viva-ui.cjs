const path = require('path');

function loadPlaywright() {
    try {
        return require('playwright');
    } catch (primaryError) {
        const runtimeRoot = path.join(
            process.env.USERPROFILE || process.env.HOME || '',
            '.cache',
            'codex-runtimes',
            'codex-primary-runtime',
            'dependencies',
            'node',
            'node_modules',
            '.pnpm'
        );
        const candidates = [
            path.join(runtimeRoot, 'playwright@1.61.1', 'node_modules'),
            path.join(runtimeRoot, 'playwright-core@1.61.1', 'node_modules')
        ];
        for (const candidate of candidates) {
            try {
                return require(require.resolve('playwright', { paths: [candidate] }));
            } catch (err) {}
        }
        throw primaryError;
    }
}

async function main() {
    const { chromium } = loadPlaywright();
    const url = process.env.MAQUETA_QA_URL || 'http://127.0.0.1:8137/maqueta-viva-torrevieja?debug=1&calibrate=1&analytics=1&zone=parque-naciones&lng=-0.6902&lat=37.9823&style=tile&sector=turismo';
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1680, height: 1250 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(url + '&qa=' + Date.now(), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#maqueta-zone-jump-bar', { timeout: 15000 });
    await page.waitForFunction(() => document.body.classList.contains('maqueta-loaded'), null, { timeout: 12000 }).catch(() => {});

    const before = await page.evaluate(() => ({
        engineDebugCompact: !!document.querySelector('#maqueta-engine-debug') && getComputedStyle(document.querySelector('#maqueta-engine-debug pre')).display === 'none',
        interactionDebugCompact: !!document.querySelector('#maqueta-interaction-debug') && getComputedStyle(document.querySelector('#maqueta-interaction-debug pre')).display === 'none',
        analyticsCompact: !!document.querySelector('#maqueta-analytics-debug') && getComputedStyle(document.querySelector('#maqueta-analytics-debug pre')).display === 'none',
        styleListHidden: getComputedStyle(document.querySelector('#style-list')).display === 'none',
        commandAccordion: !!document.querySelector('#maqueta-command-panel .maqueta-block-toggle'),
        bottomAccordion: document.querySelectorAll('#maqueta-bottom-panel .maqueta-block-toggle').length >= 2,
        collapsedPremiumBlocks: document.querySelectorAll('#maqueta-bottom-panel .maqueta-panel-block.is-collapsed').length
    }));

    await page.locator('#maqueta-zone-jump-bar [data-zone-id="plaza-iglesia"]').click();
    await page.waitForURL(/zone=plaza-iglesia/, { timeout: 10000 });
    await page.waitForFunction(() => document.body.classList.contains('maqueta-loaded'), null, { timeout: 12000 }).catch(() => {});

    const after = await page.evaluate(() => ({
        href: location.href,
        statusZone: document.querySelector('#status-zone')?.textContent?.trim(),
        analyticsVisible: !!document.querySelector('#maqueta-analytics-debug'),
        calibrationCollapsed: document.body.classList.contains('maqueta-calibration-collapsed')
    }));

    await browser.close();
    const result = { ok: true, before, after, errors };
    console.log(JSON.stringify(result, null, 2));
    if (!before.engineDebugCompact || !before.interactionDebugCompact || !before.analyticsCompact || !before.styleListHidden || !before.commandAccordion || !before.bottomAccordion || after.statusZone !== 'Plaza de la Iglesia / Plaza de la Constitucion' || !after.analyticsVisible) {
        process.exitCode = 1;
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
