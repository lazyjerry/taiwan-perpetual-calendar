from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo
from playwright.sync_api import expect, sync_playwright

BASE_URL = "http://127.0.0.1:4173"
ARTIFACT_DIR = Path("/private/tmp/app-calendar-e2e")
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
TAIPEI_TODAY = datetime.now(ZoneInfo("Asia/Taipei")).date()
day_href = lambda date: f"/day/{date.year}/{date.month:02d}/{date.day:02d}/"

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    context.grant_permissions(["clipboard-read", "clipboard-write"])
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
    assert page.locator(".site-header nav").get_by_role("link", name="昨天").get_attribute("href") == day_href(TAIPEI_TODAY - timedelta(days=1))
    assert page.locator(".site-header nav").get_by_role("link", name="明天").get_attribute("href") == day_href(TAIPEI_TODAY + timedelta(days=1))
    assert page.get_by_role("button", name="更多").is_hidden()
    assert page.locator(".date-picker").is_hidden()
    assert page.get_by_text("曆法資料支援", exact=False).count() == 0
    share_button = page.locator(".site-footer").get_by_role("button", name="分享這一頁")
    assert share_button.is_visible()
    share_button.click()
    assert page.locator(".share-status").inner_text() == "已複製連結"
    assert page.evaluate("navigator.clipboard.readText()") == f"{BASE_URL}/day/2026/09/25/"

    # 站內日期連結在原頁切換：網址、標題與內容都換了，但沒有整頁重載
    page.evaluate("window.__e2eMarker = true")
    page.get_by_role("link", name="9/24", exact=False).click()
    page.wait_for_url(f"{BASE_URL}/day/2026/09/24/")
    assert page.evaluate("window.__e2eMarker") is True
    assert page.get_by_role("heading", name="2026 年 9 月 24 日").count() == 1
    assert page.title() == "2026 年 9 月 24 日｜八月十四｜島日曆"
    assert page.locator('link[rel="canonical"]').get_attribute("href") == f"{BASE_URL}/day/2026/09/24/"
    page.wait_for_selector(".daily-goblin-canvas")
    assert page.locator(".daily-goblin-canvas").count() == 1
    page.go_back()
    page.wait_for_url(f"{BASE_URL}/day/2026/09/25/")
    assert page.evaluate("window.__e2eMarker") is True
    assert page.get_by_role("heading", name="2026 年 9 月 25 日").count() == 1
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
    index_json = page.request.get(f"{BASE_URL}/api/index.json")
    assert index_json.ok and f"最後更新時間：{index_json.json()['updatedAt']}" in page.locator(".site-footer p").inner_text()
    sitemap = page.request.get(f"{BASE_URL}/sitemap.xml")
    assert sitemap.ok and "https://taiwan-perpetual-calendar.pages.dev/day/2026/09/25/" in sitemap.text()

    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile.goto(f"{BASE_URL}/day/2026/09/25/", wait_until="networkidle")
    assert mobile.locator("body").evaluate("node => node.scrollWidth <= window.innerWidth")
    drawer_lookup = mobile.locator(".site-header nav").get_by_role("link", name="查日子")
    expect(drawer_lookup).to_be_hidden()
    mobile.get_by_role("button", name="更多").click()
    expect(drawer_lookup).to_be_visible()
    mobile.get_by_role("button", name="關閉選單").click()
    expect(drawer_lookup).to_be_hidden()
    mobile.get_by_role("button", name="更多").click()
    drawer_lookup.click()
    mobile.wait_for_url(f"{BASE_URL}/lookup/")
    expect(drawer_lookup).to_be_hidden()
    assert mobile.locator(".date-picker").is_visible()
    mobile.go_back()
    mobile.wait_for_url(f"{BASE_URL}/day/2026/09/25/")
    mobile.screenshot(path=str(ARTIFACT_DIR / "day-mobile.png"), full_page=True)
    mobile.close()

    assert not console_errors, f"瀏覽器 console 錯誤：{console_errors}"
    context.close()
    browser.close()

print(f"E2E 通過；截圖位於 {ARTIFACT_DIR}")
