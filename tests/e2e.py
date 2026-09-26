from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:4173"
ARTIFACT_DIR = Path("/private/tmp/app-calendar-e2e")
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    console_errors = []
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)

    page.goto(f"{BASE_URL}/day/2026/09/25/", wait_until="networkidle")
    assert page.get_by_role("heading", name="2026 年 9 月 25 日").count() == 1
    assert page.get_by_text("農曆八月十五", exact=False).count() >= 1
    assert page.title() == "2026 年 9 月 25 日｜八月十五｜島日曆"
    assert page.locator('link[rel="canonical"]').get_attribute("href") == f"{BASE_URL}/day/2026/09/25/"
    assert page.locator(".daily-image img").evaluate("image => image.complete && image.naturalWidth > 0")
    assert page.locator(".daily-image img").get_attribute("src") == "/images/daily/months/09-late.webp"
    assert page.get_by_role("link", name="9/24", exact=False).get_attribute("href") == "/day/2026/09/24/"
    assert page.locator(".site-header nav").get_by_role("link", name="查看 9 月").get_attribute("href") == "/calendar/2026/09/"
    assert page.locator(".date-picker").is_hidden()
    page.screenshot(path=str(ARTIFACT_DIR / "day-desktop.png"), full_page=True)

    page.goto(f"{BASE_URL}/calendar/2026/09/", wait_until="networkidle")
    assert page.get_by_role("link", name="9 月 25 日，八月十五").count() == 1
    assert page.locator(".date-picker").count() == 0
    page.screenshot(path=str(ARTIFACT_DIR / "month-desktop.png"), full_page=True)

    page.goto(f"{BASE_URL}/lookup/?date=1901-01-01", wait_until="networkidle")
    assert page.locator(".lookup-card").count() == 1
    assert page.get_by_text("1901 / 01 / 01", exact=False).count() == 1

    day_json = page.request.get(f"{BASE_URL}/api/day/2026/09/25.json")
    assert day_json.ok and day_json.json()["lunar"]["display"] == "八月十五"
    month_json = page.request.get(f"{BASE_URL}/api/month/2026/09.json")
    assert month_json.ok and len(month_json.json()["days"]) == 30
    sitemap = page.request.get(f"{BASE_URL}/sitemap.xml")
    assert sitemap.ok and "https://taiwan-perpetual-calendar.pages.dev/day/2026/09/25/" in sitemap.text()

    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile.goto(f"{BASE_URL}/day/2026/09/25/", wait_until="networkidle")
    assert mobile.locator("body").evaluate("node => node.scrollWidth <= window.innerWidth")
    mobile.screenshot(path=str(ARTIFACT_DIR / "day-mobile.png"), full_page=True)
    mobile.close()

    assert not console_errors, f"瀏覽器 console 錯誤：{console_errors}"
    context.close()
    browser.close()

print(f"E2E 通過；截圖位於 {ARTIFACT_DIR}")
