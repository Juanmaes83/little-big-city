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

    const before = await page.evaluate(() => {
        const toolbox = document.querySelector('#maqueta-toolbox');
        const toolboxPanel = document.querySelector('#maqueta-toolbox-panel');
        const calibration = document.querySelector('#maqueta-calibration-panel');
        const engineDebug = document.querySelector('#maqueta-engine-debug');
        const interactionDebug = document.querySelector('#maqueta-interaction-debug');
        const analyticsDebug = document.querySelector('#maqueta-analytics-debug');
        const legacyMap = document.querySelector('#map');
        const dock = document.querySelector('#maqueta-bottom-panel');
        const credits = document.querySelector('#credits');
        const brandCredit = document.querySelector('#maqueta-brand-credit');
        return {
        calibrationInToolbox: !!calibration && calibration.parentElement?.id === 'maqueta-toolbox-calibration',
        engineDebugInToolbox: !!engineDebug && engineDebug.parentElement?.id === 'maqueta-toolbox-debug',
        interactionDebugInToolbox: !!interactionDebug && interactionDebug.parentElement?.id === 'maqueta-toolbox-debug',
        analyticsInToolbox: !!analyticsDebug && analyticsDebug.parentElement?.id === 'maqueta-toolbox-analytics',
        toolboxPanelHidden: !!toolboxPanel && getComputedStyle(toolboxPanel).display === 'none',
        legacyMapAlive: !!legacyMap && getComputedStyle(legacyMap).display === 'block' && getComputedStyle(legacyMap).visibility === 'hidden' && legacyMap.getBoundingClientRect().width > 0,
        creditsHidden: !!credits && getComputedStyle(credits).display === 'none',
        brandCreditVisible: !!brandCredit && getComputedStyle(brandCredit).display !== 'none',
        dockCompact: !!dock && dock.getBoundingClientRect().height <= 190,
        styleListHidden: getComputedStyle(document.querySelector('#style-list')).display === 'none',
        topbarCompact: !!document.querySelector('#maqueta-zone-jump-bar') && document.querySelector('#maqueta-zone-jump-bar').getBoundingClientRect().height <= 72,
        noZoneChipLinks: document.querySelectorAll('#maqueta-zone-jump-bar a[data-zone-id]').length === 0,
        zoneSwitcherCentered: !!document.querySelector('#maqueta-zone-switcher'),
        commandAccordion: !!document.querySelector('#maqueta-command-panel .maqueta-block-toggle'),
        bottomDockTabs: document.querySelectorAll('[data-dock-tab]').length >= 6,
        activeDockPanels: document.querySelectorAll('[data-dock-panel]:not([hidden])').length,
        toolboxClosed: !!toolbox && !toolbox.classList.contains('is-open'),
        statusStrip: !!document.querySelector('#maqueta-status-panel') && getComputedStyle(document.querySelector('#maqueta-status-panel')).flexWrap === 'nowrap',
        poiCarousel: !!document.querySelector('.maqueta-poi-list') && getComputedStyle(document.querySelector('.maqueta-poi-list')).display === 'flex'
    };
    });

    await page.locator('#maqueta-zone-switcher').click();
    await page.locator('#maqueta-zone-dropdown [data-zone-id="plaza-iglesia"]').click();
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
    if (!before.calibrationInToolbox || !before.engineDebugInToolbox || !before.interactionDebugInToolbox || !before.analyticsInToolbox || !before.toolboxPanelHidden || !before.legacyMapAlive || !before.creditsHidden || !before.brandCreditVisible || !before.dockCompact || !before.styleListHidden || !before.topbarCompact || !before.noZoneChipLinks || !before.zoneSwitcherCentered || !before.commandAccordion || !before.bottomDockTabs || before.activeDockPanels !== 2 || !before.toolboxClosed || !before.statusStrip || !before.poiCarousel || after.statusZone !== 'Plaza de la Iglesia / Plaza de la Constitucion' || !after.analyticsVisible) {
        process.exitCode = 1;
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
