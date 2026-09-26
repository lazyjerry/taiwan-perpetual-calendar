import sys
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:4173"
OUTPUT_DIR = Path(sys.argv[1] if len(sys.argv) > 1 else "/private/tmp/app-calendar-goblin-audit")
VIEWPORTS = {
    "desktop": {"width": 1000, "height": 900},
    "mobile": {"width": 390, "height": 844},
}


def stable_index(value: str, length: int) -> int:
    value_hash = 2166136261
    for character in value:
        value_hash ^= ord(character)
        value_hash = (value_hash * 16777619) & 0xFFFFFFFF
    return value_hash % length


def representative_dates() -> list[str]:
    dates = []
    for month in range(1, 13):
        for days in (range(1, 16), range(16, 29)):
            matches = {}
            for day in days:
                date_key = f"2026-{month:02d}-{day:02d}"
                matches.setdefault(stable_index(f"placement:{date_key}", 2), date_key)
            dates.extend(matches[index] for index in (0, 1))
    return dates


DATES = representative_dates()


def make_contact_sheet(kind: str, captures: list[tuple[str, Path]]) -> Path:
    tile_width = 420
    label_height = 34
    columns = 4
    rendered = []
    for date_key, path in captures:
        image = Image.open(path).convert("RGB")
        ratio = tile_width / image.width
        image = image.resize((tile_width, round(image.height * ratio)), Image.Resampling.LANCZOS)
        tile = Image.new("RGB", (tile_width, image.height + label_height), "#f4f0e7")
        tile.paste(image, (0, label_height))
        ImageDraw.Draw(tile).text((12, 9), date_key, fill="#1f2b22")
        rendered.append(tile)

    rows = (len(rendered) + columns - 1) // columns
    row_height = max(tile.height for tile in rendered)
    sheet = Image.new("RGB", (columns * tile_width, rows * row_height), "#ddd7ca")
    for index, tile in enumerate(rendered):
        sheet.paste(tile, ((index % columns) * tile_width, (index // columns) * row_height))

    output = OUTPUT_DIR / f"{kind}-contact-sheet.jpg"
    sheet.save(output, quality=90)
    return output


OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
console_errors = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for kind, viewport in VIEWPORTS.items():
        page = browser.new_page(viewport=viewport, device_scale_factor=1)
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        captures = []
        for date_key in DATES:
            year, month, day = date_key.split("-")
            page.goto(f"{BASE_URL}/day/{year}/{month}/{day}/", wait_until="networkidle")
            page.wait_for_selector(".daily-goblin-canvas")
            page.wait_for_function(
                "document.querySelector('.daily-goblin-canvas')?.getContext('2d')?.getImageData(0, 0, 1, 1) !== undefined"
            )
            output = OUTPUT_DIR / f"{kind}-{date_key}.png"
            page.locator(".daily-image").screenshot(path=str(output))
            captures.append((date_key, output))
        page.close()
        print(make_contact_sheet(kind, captures))
    browser.close()

assert not console_errors, f"瀏覽器 console 錯誤：{console_errors}"
