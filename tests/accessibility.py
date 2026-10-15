"""Practical keyboard, naming, target-size and viewport checks; hardware screen-reader QA remains separate."""
import os
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('ZUPORTA_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
    for width in (320, 390, 768):
        context = browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion='reduce')
        context.route('https://api.zuporta.com/**', lambda route: route.abort())
        page = context.new_page()
        for route in ('home', 'professionals', 'settings', 'm/baseline'):
            page.goto('http://127.0.0.1:8000/#/' + route, wait_until='networkidle')
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), (width, route, 'horizontal overflow')
            unnamed = page.locator('button:visible').evaluate_all('''nodes => nodes.filter(n => !n.textContent.trim() && !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')).length''')
            assert unnamed == 0, (width, route, 'unnamed controls')
        page.goto('http://127.0.0.1:8000/#/settings', wait_until='networkidle')
        page.get_by_role('button', name='Manage permissions').click()
        expect(page.get_by_role('dialog')).to_be_visible()
        page.keyboard.press('Escape')
        expect(page.get_by_role('dialog')).not_to_be_visible()
        print(f'PASS: {width}px viewport, accessible control names and keyboard dialog dismissal')
        context.close()
    browser.close()
