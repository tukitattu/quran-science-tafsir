#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Browser smoke tests for the static site.

Run by Web CI against a local static server:

    python3 -m http.server 8099 --bind 127.0.0.1 &
    python3 tests/web_smoke.py

Playwright is installed by CI (`pip install playwright && playwright install
chromium`), never vendored into the repo. Any console error, CSP violation,
missing content or uncaught exception fails the run.
"""
from __future__ import annotations

import os
import re
import sys

from playwright.sync_api import sync_playwright

BASE = os.environ.get("SMOKE_BASE", "http://127.0.0.1:8099")

PAGES = [
    ("/", "Al Quran"),
    ("/index.html", "Al Quran"),
    ("/part1.html", ""),
    ("/part2.html", ""),
    ("/part3.html", ""),
    ("/words.html", "Word"),
    ("/more.html", "Knowledge"),
    ("/business.html", "Business"),
    ("/search.html", "Search"),
    ("/notes.html", ""),
    ("/vocabulary.html", ""),
    ("/chapters/2.html", "Al-Baqarah"),
    ("/chapters/2/read/page1.html", ""),
    ("/chapters/2/arabic.html", ""),
    ("/404.html", "404"),
]

ASSETS = [
    "/manifest.json",
    "/sw.js",
    "/sitemap.xml",
    "/robots.txt",
    "/assets/data/tr/2.json",
    "/assets/data/words_index.json",
    "/assets/data/more/names.json",
    "/assets/css/style.css",
]

failures: list[str] = []
browser_errors: list[str] = []


def check(cond, msg: str) -> None:
    if not cond:
        failures.append(msg)


def main() -> int:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path=os.environ.get("CHROME_PATH") or None,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        )

        def open_page(path: str, color_scheme: str = "light"):
            ctx = browser.new_context(
                viewport={"width": 1280, "height": 900},
                color_scheme=color_scheme,
            )
            page = ctx.new_page()

            # 404.html is served by GitHub Pages from any path and therefore
            # uses absolute deployment URLs; those cannot resolve on a local
            # static server, so its network noise is expected and ignored.
            if path != "/404.html":
                page.on(
                    "pageerror",
                    lambda err: browser_errors.append(f"pageerror {path}: {err}"),
                )
                page.on(
                    "console",
                    lambda m: browser_errors.append(f"console {path}: {m.text}")
                    if m.type == "error"
                    else None,
                )
                page.on(
                    "requestfailed",
                    lambda r: browser_errors.append(f"requestfailed {path}: {r.url}")
                    if r.url.startswith(BASE)
                    else None,
                )
            res = page.goto(BASE + path, wait_until="domcontentloaded")
            return ctx, page, (res.status if res else 0)

        # --- every page loads, renders and stays error-free --------------
        for path, expect_text in PAGES:
            ctx, page, status = open_page(path)
            page.wait_for_timeout(600)
            check(status == 200, f"{path}: HTTP {status}")
            check(len(page.title().strip()) > 2, f"{path}: empty <title>")
            body = page.locator("body").inner_text().strip()
            check(len(body) > 40, f"{path}: body looks empty")
            if expect_text:
                check(
                    expect_text.lower() in body.lower(),
                    f'{path}: expected body to mention "{expect_text}"',
                )
            sheets = page.evaluate("document.styleSheets.length")
            check(sheets > 0, f"{path}: no stylesheets applied")
            csp = page.evaluate(
                "!!document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')"
            )
            check(csp, f"{path}: missing CSP meta tag")
            ctx.close()

        # --- word explorer: pagination + live search ---------------------
        ctx, page, _ = open_page("/words.html")
        page.wait_for_selector("#wordGrid .word-tile", timeout=30000)
        tiles = page.locator("#wordGrid .word-tile").count()
        check(tiles >= 300, f"/words.html: only {tiles} tiles rendered (expected 300)")
        count = page.locator("#wCount").inner_text()
        check(bool(re.search(r"\d{4,}", count)), f'/words.html: count "{count}" is not 14k+')
        page.fill("#wSearch", "mercy")
        page.wait_for_timeout(600)
        filtered = page.locator("#wordGrid .word-tile").count()
        check(0 < filtered < tiles, f"/words.html: search did not filter ({filtered})")
        page.fill("#wSearch", "zzzznotaword")
        page.wait_for_timeout(500)
        check(page.locator("#wEmpty").is_visible(), "/words.html: empty state not shown")
        ctx.close()

        # --- knowledge hub: every tab renders ---------------------------
        ctx, page, _ = open_page("/more.html")
        page.wait_for_selector("#moreTabs button", timeout=30000)
        tabs = page.locator("#moreTabs button").count()
        check(tabs == 5, f"/more.html: {tabs} tabs, expected 5 collections")
        for i in range(tabs):
            page.locator("#moreTabs button").nth(i).click()
            page.wait_for_timeout(450)
            text = page.locator("#moreBody").inner_text().strip()
            check(len(text) > 100, f"/more.html: tab {i} rendered {len(text)} chars")
        page.locator("#moreTabs button").first.click()
        page.wait_for_timeout(300)
        page.fill("#moreSearch", "merciful")
        page.wait_for_timeout(500)
        results = page.locator("#moreBody").inner_text().strip()
        check(len(results) > 50, "/more.html: search produced no output")
        ctx.close()

        # --- business knowledge: 147 entries ----------------------------
        ctx, page, _ = open_page("/business.html")
        page.wait_for_selector("#bizBody .biz-card, #bizBody article", timeout=30000)
        count = page.locator("#bizCount").inner_text()
        check("147" in count, f'/business.html: count "{count}" is not 147')
        cards = page.locator("#bizBody .biz-card, #bizBody article").count()
        check(cards > 0, "/business.html: no entries rendered")
        tabs = page.locator("#bizTabs button").count()
        check(tabs == 7, f"/business.html: {tabs} tabs, expected All + 6 sections")
        ctx.close()

        # --- chapter translations accordion -----------------------------
        ctx, page, _ = open_page("/chapters/2.html")
        if page.locator("#kb-translations-2").count() != 1:
            failures.append("/chapters/2.html: translation accordion missing")
        else:
            page.locator("#kb-translations-2 summary").click()
            try:
                page.wait_for_selector("#tr-body-2 .tr-ayah", timeout=60000)
                text = page.locator("#tr-body-2").inner_text()
                check("Alif" in text, "/chapters/2.html: first ayah not rendered")
            except Exception as exc:  # noqa: BLE001 - report page state
                body = page.locator("#tr-body-2").inner_text()[:200]
                failures.append(
                    f"/chapters/2.html: translations never rendered ({exc}); body={body!r}"
                )
            options = page.locator("#tr-body-2 .tr-src").count()
            check(options == 7, f"/chapters/2.html: {options} editions, expected 7")
        ctx.close()

        # --- dark theme is actually dark --------------------------------
        ctx, page, _ = open_page("/index.html", color_scheme="dark")
        page.wait_for_timeout(800)
        bg = page.evaluate("getComputedStyle(document.body).backgroundColor")
        m = re.match(r"rgba?\((\d+),\s*(\d+),\s*(\d+)", bg)
        check(
            bool(m) and sum(int(m.group(i)) for i in (1, 2, 3)) < 300,
            f"/index.html: dark theme background is {bg}",
        )
        ctx.close()

        # --- manifest + service worker are fetchable --------------------
        ctx = browser.new_context()
        page = ctx.new_page()
        for asset in ASSETS:
            res = page.request.get(BASE + asset)
            check(res.status == 200, f"{asset}: HTTP {res.status}")
        ctx.close()

        browser.close()

    if browser_errors:
        print("\nBrowser errors:")
        for err in browser_errors:
            print("  ✗ " + err)
        failures.extend("browser error: " + e for e in browser_errors)

    if failures:
        print(f"\n{len(failures)} smoke failure(s):")
        for f in failures:
            print("  ✗ " + f)
        return 1

    print(
        "✓ web smoke: pages, words, knowledge hub, business, translations, "
        "dark theme and assets OK"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
