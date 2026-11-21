const { chromium } = require('playwright');
const fs = require('fs');
const SP = '/tmp/claude-0/-home-claude/2639968e-08f0-5d43-98c6-fd4af7aa9d78/scratchpad/test';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.route('**/chart.umd.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(SP + '/node_modules/chart.js/dist/chart.umd.js') }));
  await page.goto('file:///home/claude/dataviz.html');
  await page.waitForTimeout(600);
  const log = (k, v) => console.log(k.padEnd(34), v);

  // table + pager
  log('rows on page', await page.locator('#dataTable tbody tr').count());
  log('headers', (await page.locator('#dataTable th').allTextContents()).join('|'));
  log('pager', await page.locator('#pgInfo').textContent());
  await page.click('#nextPg'); log('pager after next', await page.locator('#pgInfo').textContent());
  log('stats hidden initially?', await page.locator('#stats').isHidden());
  await page.click('.colbtn >> text=Revenue'); log('stats dt count', await page.locator('#stats dt').count());
  log('stats', (await page.locator('#stats').innerText()).replace(/\n/g, ' '));
  await page.click('.colbtn >> text=Category'); log('cat stats', (await page.locator('#stats').innerText()).replace(/\n/g, ' '));
  await page.click('.colbtn >> text=Category'); log('stats hidden after toggle', await page.locator('#stats').isHidden());

  // limits
  await page.fill('#nSamples', '500'); await page.press('#nSamples', 'Enter'); await page.locator('#nSamples').blur();
  log('samples clamp', await page.inputValue('#nSamples') + ' / ' + await page.locator('#pgInfo').textContent());
  await page.fill('#nCols', '99'); await page.locator('#nCols').blur();
  log('cols clamp', await page.inputValue('#nCols') + ' / headers ' + await page.locator('#dataTable th').count());
  await page.fill('#nSamples', '50'); await page.locator('#nSamples').blur();
  await page.fill('#nCols', '3'); await page.locator('#nCols').blur();

  // every chart in every mode
  const modes = [['Categories', ['Bar', 'Pie', 'Box plot', 'Violin', 'Point plot']], ['Trends', ['Line', 'Area']], ['Distribution', ['Histogram', 'KDE', 'Correlation heatmap']]];
  for (const [m, charts] of modes) {
    await page.click(`#modeTabs button:text-is("${m}")`);
    for (const c of charts) {
      await page.click(`#chartTabs button:text-is("${c}")`); await page.waitForTimeout(500);
      const box = await page.locator('#cv').boundingBox();
      if (box) { await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5); await page.waitForTimeout(250); }
      const tipOn = await page.evaluate(() => getComputedStyle(document.getElementById('tip')).display !== 'none');
      const empty = await page.locator('#empty').isVisible();
      log(`${m} / ${c}`, `canvas ${box ? Math.round(box.width) + 'x' + Math.round(box.height) : 'none'} tooltip=${tipOn} empty=${empty} legend=${await page.locator('#legend .lg').count()}`);
      await page.screenshot({ path: `${SP}/${m}-${c.replace(/ /g, '_')}.png` });
    }
  }
  // table view + dark theme + edit cell
  await page.click('#viewBtn'); await page.waitForTimeout(200);