"""Capture the implemented app without seeded wellness data or invented coaches.

Browser captures are listing drafts; confirm parity with the signed native build
and replace any platform-specific view during device QA.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

output = Path('store/screenshots')
output.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('ZUPORTA_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
    for platform, width, height in [('iphone-6.9', 440, 956), ('android-phone', 360, 640)]:
        folder = output / platform
        folder.mkdir(exist_ok=True)
        context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=3, reduced_motion='reduce')
        context.route('https://api.zuporta.com/**', lambda route: route.abort())
        page = context.new_page()
        for name, route in [('01-home', 'home'), ('02-baseline', 'm/baseline'), ('03-local-privacy', 'settings')]:
            page.goto('http://127.0.0.1:8000/#/' + route, wait_until='networkidle')
            page.screenshot(path=str(folder / (name + '.png')))
        page.goto('http://127.0.0.1:8000/#/home', wait_until='networkidle')
        page.locator('#view').get_by_role('button', name='Start', exact=True).click()
        page.get_by_role('button', name='6 out of 10', exact=True).last.click()
        page.locator('#view .quick:enabled').first.click()
        expect(page.locator('.wcard--activity').last).to_be_visible()
        page.screenshot(path=str(folder / '04-guided-reset.png'))
        context.close()
        print(f'Captured four {platform} listing drafts.')
    context = browser.new_context(viewport={'width': 1024, 'height': 500}, device_scale_factor=1)
    page = context.new_page()
    page.goto('http://127.0.0.1:8000/', wait_until='domcontentloaded')
    page.set_content('''<!doctype html><html><head><style>
      *{box-sizing:border-box}body{margin:0;background:#eef4fa;color:#10202e;font-family:Arial,sans-serif}
      main{width:1024px;height:500px;display:flex;align-items:center;padding:64px;gap:74px}
      .brand{flex:1}img{width:62px;height:62px;border-radius:18px;margin-bottom:24px}
      h1{font-family:Georgia,serif;font-size:72px;font-weight:500;letter-spacing:-3px;margin:0 0 20px}
      p{font-size:25px;line-height:1.4;margin:0;max-width:480px;color:#425c73}
      .card{background:white;border:1px solid #dbe5f0;border-radius:30px;padding:34px;width:290px;box-shadow:0 18px 60px #15365012}
      .label{font-size:14px;letter-spacing:2px;color:#526c85}h2{font-family:Georgia,serif;font-weight:400;font-size:31px;margin:20px 0}
      .ring{border:16px solid #e0ebf5;border-radius:100%;width:150px;height:150px;display:grid;place-items:center;color:#2c63a8;font-size:19px;margin:auto}
    </style></head><body><main><div class="brand"><img src="http://127.0.0.1:8000/assets/img/icon-192.png"><h1>Zuporta+</h1><p>Pause. Check in.<br>Take your next small step.</p></div><div class="card"><div class="label">PERSONAL WELLNESS</div><h2>A moment for you</h2><div class="ring">Breathe</div></div></main></body></html>''')
    page.screenshot(path=str(output / 'play-feature-graphic.png'))
    browser.close()
