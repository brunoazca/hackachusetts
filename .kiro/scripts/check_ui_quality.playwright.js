// Run against a local server using playwright-cli run-code --filename=<this file>.
// Create /tmp/piper-quality first. Uses live public data; performs no data writes.
async (page) => {
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const focusOn = async (id) => {
    try {
      await page.waitForFunction((expected) => document.activeElement?.id === expected, id, { timeout: 5000 });
    } catch {
      throw new Error(`Expected focus on ${id}; got ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0,200))}`);
    }
  };
  const output = "/tmp/piper-quality";
  const base = new URL(page.url()).origin;
  await page.goto(base);
  await page.getByRole("radio", { name: "Places to visit", exact: true }).waitFor();
  await page.emulateMedia({ media: "screen", reducedMotion: "reduce" });

  const widths = [320, 390, 640, 768, 1024, 1280];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 });
    const boxes = await page.locator("header button").evaluateAll((els) => els.map((el) => {
      const box = el.getBoundingClientRect();
      return { label: el.getAttribute("aria-label") || el.textContent, left: box.left, right: box.right, width: box.width };
    }));
    check(boxes.every((box) => box.left >= 0 && box.right <= width && box.width >= 24), `Clipped header at ${width}: ${JSON.stringify(boxes)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const view = page.getByRole("radiogroup", { name: "View" });
  await view.getByRole("radio", { name: "Places to visit", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  check(await view.getByRole("radio", { name: "Map", exact: true }).getAttribute("aria-checked") === "true", "ArrowRight must select Map");
  await page.keyboard.press("ArrowRight");
  check(await view.getByRole("radio", { name: "Places to visit", exact: true }).getAttribute("aria-checked") === "true", "View selection must wrap");
  check(await view.locator('[tabindex="0"]').count() === 1, "Only the selected radio belongs in the Tab order");

  await page.getByRole("button", { name: "Open Inspect", exact: true }).focus();
  await page.keyboard.press("Enter");
  await focusOn("side-tab-inspector");
  const panel = page.locator("#details-panel");
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    const box = await panel.boundingBox();
    const header = await page.locator("header").boundingBox();
    check(box && header && box.x >= 0 && box.x + box.width <= width && box.y >= header.y + header.height, `Details overlap the header or viewport at ${width}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  check(!(await page.getByRole("combobox", { name: "Neighborhood" }).isVisible()), "Covered queue must be hidden on mobile");
  await page.keyboard.press("ArrowRight");
  await focusOn("side-tab-insights");
  await page.keyboard.press("End");
  await focusOn("side-tab-chat");
  await page.keyboard.press("Home");
  await focusOn("side-tab-inspector");
  check(await panel.locator('[role="tab"][tabindex="0"]').count() === 1, "Only the selected tab belongs in the Tab order");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open Inspect");

  const place = page.getByRole("list", { name: /^Places,/ }).getByRole("button").first();
  await place.waitFor({ timeout: 30000 });
  await page.screenshot({ path: `${output}/mobile-places.png` });
  await place.focus();
  await page.keyboard.press("Enter");
  await focusOn("side-tab-inspector");
  await page.getByRole("link", { name: "Open inspection brief" }).waitFor({ timeout: 30000 });
  await page.screenshot({ path: `${output}/mobile-inspect.png` });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.activeElement?.hasAttribute("data-site-trigger"), null, { timeout: 5000 });
  check(await place.evaluate((el) => document.activeElement === el), "Escape must return to the selected place");
  await page.keyboard.press("Enter");
  await page.getByRole("link", { name: "Open inspection brief" }).click();
  await page.locator(".brief-records > li").first().waitFor({ timeout: 30000 });
  const records = await page.locator(".brief-records > li").count();
  check(records > 0, "Live brief must include records");
  await page.emulateMedia({ media: "print" });
  check(await page.locator(".inspection-brief").evaluate((el) => getComputedStyle(el).visibility === "visible"), "Global print styles must not hide the brief");
  check(await page.locator(".brief-toolbar").evaluate((el) => getComputedStyle(el).display === "none"), "Print controls must not appear in PDF");
  await page.pdf({ path: `${output}/inspection-brief-letter.pdf`, format: "Letter" });
  await page.pdf({ path: `${output}/inspection-brief-a4.pdf`, format: "A4" });
  await page.emulateMedia({ media: "screen" });

  // Test button wiring separately from genuine PDF rendering; no native dialog to dismiss.
  await page.evaluate(() => {
    window.__originalPrint = window.print;
    window.__printCalls = 0;
    window.print = () => { window.__printCalls++; };
  });
  try {
    await page.getByRole("button", { name: "Print / Save PDF" }).click();
    check(await page.evaluate(() => window.__printCalls === 1), "Print button must invoke window.print once");
  } finally {
    await page.evaluate(() => { window.print = window.__originalPrint; delete window.__originalPrint; delete window.__printCalls; });
  }
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download brief" }).click();
  await (await downloaded).saveAs(`${output}/inspection-brief.html`);
  return { passed: true, widths, records, output, checks: "header bounds; radio/tab keys; focus restoration; mobile panel bounds; live queue to brief; Letter/A4 rendering; print button; HTML download" };
}
