"""Browser integration with the actual SDK bundle and a mocked Capacitor bridge.

This exercises UI-to-plugin calls, not a native device, OS notification delivery,
physical haptics, platform share sheets, or real system-bar rendering.
"""
import os
from playwright.sync_api import sync_playwright, expect

ORIGIN = os.environ.get('ZUPORTA_TEST_ORIGIN', 'http://127.0.0.1:8000')
MOCK_BRIDGE = r"""
window.androidBridge = {};
window.nativeCalls = [];
window.nativeListeners = {};
window.nativePermission = 'prompt';
window.nativeRequestResult = 'denied';
window.nativeShareCancel = false;
window.nativeBrowserFailure = false;
window.nativeScheduleFailure = false;
const methods = {
  App: ['minimizeApp', 'getLaunchUrl'],
  LocalNotifications: ['checkPermissions', 'requestPermissions', 'cancel', 'createChannel', 'schedule'],
  Haptics: ['impact'], Share: ['share'], Browser: ['open'], SystemBars: ['setStyle'],
};
window.Capacitor = {
  PluginHeaders: Object.entries(methods).map(([name, names]) => ({ name, methods: [
    ...names.map(name => ({ name, rtype: 'promise' })), { name: 'addListener', rtype: 'callback' },
  ] })),
  nativePromise: async (plugin, method, options) => {
    nativeCalls.push({ plugin, method, options });
    if (method === 'checkPermissions') return { display: nativePermission };
    if (method === 'requestPermissions') return { display: window.nativePermission = nativeRequestResult };
    if (method === 'share' && nativeShareCancel) throw new Error('Share canceled');
    if (method === 'schedule' && nativeScheduleFailure) throw new Error('Schedule failed');
    if (method === 'open' && nativeBrowserFailure) throw new Error('Browser unavailable');
    return {};
  },
  nativeCallback: (plugin, method, options, callback) => {
    nativeListeners[options.eventName] = callback;
    return options.eventName;
  },
};
"""

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('ZUPORTA_CHROMIUM', '/usr/bin/chromium'),
                                headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce', service_workers='block')
    context.add_init_script(MOCK_BRIDGE)
    context.route('https://api.zuporta.com/**', lambda route: route.abort())
    page = context.new_page()
    page.set_default_timeout(10000)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(ORIGIN + '/#/settings', wait_until='networkidle')
    page.wait_for_function('!!nativeListeners.appStateChange')

    def calls(method):
        return page.evaluate('(method) => nativeCalls.filter(c => c.method === method)', method)

    def route(name, title):
        page.evaluate('(name) => location.hash = "#/" + name', name)
        expect(page.locator('#view-title')).to_have_text(title)

    expect(page.locator('#install-btn')).to_be_hidden()
    expect(page.locator('#install-banner')).to_be_hidden()
    expect(page.get_by_label('Reminder time (device local time)')).to_have_value('19:00')
    assert calls('requestPermissions') == [] and calls('schedule') == []
    page.get_by_role('button', name='Enable daily reminder', exact=True).click()
    expect(page.get_by_role('status').filter(has_text='Notifications are off')).to_be_visible()
    assert len(calls('requestPermissions')) == 1 and calls('schedule') == []
    page.evaluate("nativePermission = 'granted'")
    page.get_by_label('Reminder time (device local time)').fill('20:15')
    page.get_by_role('button', name='Enable daily reminder', exact=True).click()
    expect(page.get_by_role('button', name='Turn off reminder', exact=True)).to_be_visible()
    schedule = calls('schedule')[-1]['options']['notifications'][0]
    assert schedule['schedule']['on'] == {'hour': 20, 'minute': 15, 'second': 0}
    assert schedule['isExactNotification'] is False
    page.get_by_label('Reminder time (device local time)').fill('21:10')
    page.get_by_role('button', name='Save reminder time', exact=True).click()
    expect(page.get_by_role('status').filter(has_text='On · daily at 21:10')).to_be_visible()
    page.get_by_label('Reminder time (device local time)').fill('')
    page.get_by_role('button', name='Turn off reminder', exact=True).click()
    expect(page.get_by_role('button', name='Enable daily reminder', exact=True)).to_be_visible()
    assert page.evaluate('JSON.parse(localStorage.getItem("zuporta.reminder")).enabled') is False
    assert calls('cancel')[-1]['options'] == {'notifications': [{'id': 41001}]}
    page.evaluate('nativeScheduleFailure = true')
    page.get_by_role('button', name='Enable daily reminder', exact=True).click()
    expect(page.get_by_role('status').filter(has_text='Off · Schedule failed')).to_be_visible()
    expect(page.get_by_role('button', name='Turn off reminder', exact=True)).to_have_count(0)
    assert page.evaluate('JSON.parse(localStorage.getItem("zuporta.reminder")).enabled') is False
    page.evaluate('nativeScheduleFailure = false')
    print('PASS: native reminder opt-in, denial, chosen time, replacement and cancellation (mocked bridge)', flush=True)

    # Notifications open Home; system permission revocation reconciles without another prompt.
    page.get_by_role('button', name='Enable daily reminder', exact=True).click()
    expect(page.get_by_role('button', name='Turn off reminder', exact=True)).to_be_visible()
    page.evaluate("nativePermission = 'denied'; nativeListeners.appStateChange({isActive:true})")
    expect(page.get_by_role('button', name='Enable daily reminder', exact=True)).to_be_visible()
    assert len(calls('requestPermissions')) == 1
    page.evaluate("nativeListeners.localNotificationActionPerformed({notification:{id:41001}, actionId:'tap'})")
    expect(page.locator('#view-title')).to_have_text('Home')
    print('PASS: resume handles revoked permission without prompting; reminder tap opens check-in (mocked bridge)', flush=True)

    # Stack a sheet above an open drawer and consume back in that order.
    route('settings', 'Settings')
    page.locator('#menu-btn').click()
    page.evaluate("[...document.querySelectorAll('#view button')].find(b=>b.textContent==='Manage permissions').click()")
    expect(page.locator('#sheet')).to_be_visible()
    page.evaluate('nativeListeners.backButton({canGoBack:true})')
    expect(page.locator('#sheet')).to_be_hidden()
    expect(page.locator('#nav')).to_have_class('nav is-open')
    page.evaluate('nativeListeners.backButton({canGoBack:true})')
    expect(page.locator('#nav')).not_to_have_class('nav is-open')
    page.evaluate('nativeListeners.backButton({canGoBack:true})')
    expect(page.locator('#view-title')).to_have_text('Home')
    assert calls('minimizeApp') == []
    page.evaluate('nativeListeners.backButton({canGoBack:true})')
    page.wait_for_function('nativeCalls.some(c => c.method === "minimizeApp")')
    print('PASS: Android back closes sheet, then drawer, returns Home, then minimizes (mocked bridge)', flush=True)

    route('professionals', 'Professionals')
    page.get_by_role('link', name='Sign in', exact=True).click()
    page.wait_for_function('nativeCalls.some(c => c.method === "open")')
    assert calls('open')[-1]['options']['url'].startswith('https://zuporta.com/')
    assert page.url.startswith(ORIGIN + '/#/professionals')
    page.evaluate('nativeBrowserFailure = true')
    page.get_by_role('link', name='Browse coaches', exact=True).click()
    expect(page.locator('#toasts')).to_contain_text('Could not open the browser.')
    page.evaluate('nativeBrowserFailure = false')
    page.locator('#menu-btn').click()
    page.locator('#theme-toggle').click()
    page.wait_for_function('nativeCalls.filter(c => c.method === "setStyle").at(-1).options.style === "DARK"')
    page.locator('#nav-close').click()
    print('PASS: account/booking links use Browser with visible failure; native bars follow theme (mocked bridge)', flush=True)

    route('home', 'Home')
    page.locator('#view').get_by_role('button', name='Start', exact=True).click()
    page.get_by_role('button', name='6 out of 10', exact=True).last.click()
    page.locator('#view .quick:enabled').first.click()
    activity = page.locator('.wcard--activity').last
    expect(activity).to_be_visible()
    page.locator('#toasts').evaluate('(node) => node.replaceChildren()')
    activity.get_by_role('button', name='Share exercise', exact=True).click()
    page.wait_for_function('nativeCalls.some(c => c.method === "share")')
    shared = calls('share')[-1]['options']
    assert shared['title'] == '3-Minute Reset'
    assert '1. ' in shared['text'] and '6/10' not in shared['text'] and 'before' not in shared
    page.evaluate('nativeShareCancel = true')
    activity.get_by_role('button', name='Share exercise', exact=True).click()
    expect(activity.get_by_role('button', name='Share exercise', exact=True)).to_be_enabled()
    assert 'Could not share' not in page.locator('#toasts').inner_text()
    print('PASS: sharing sends public instructions only; share-sheet cancellation is quiet (mocked bridge)', flush=True)

    # A real breathing timer in the app calls the bundled Haptics adapter at phase transitions.
    page.clock.install()
    while activity.locator('.breathe').count() == 0:
        activity.get_by_role('button', name='Next', exact=True).click()
    activity.locator('.breathe').get_by_role('button', name='Start', exact=True).click()
    page.clock.run_for(50)
    expect(activity.locator('.breathe__word')).to_have_text('Breathe in')
    assert len(calls('impact')) == 1
    page.clock.run_for(4000)
    expect(activity.locator('.breathe__word')).to_have_text('Breathe out')
    assert len(calls('impact')) == 2
    activity.locator('.breathe').get_by_role('button', name='Stop', exact=True).click()
    page.clock.run_for(12000)
    assert len(calls('impact')) == 2
    activity.locator('.breathe').get_by_role('button', name='Start', exact=True).click()
    page.clock.run_for(50)
    assert len(calls('impact')) == 3
    activity.get_by_role('button', name='Next', exact=True).click()
    page.clock.run_for(12000)
    assert len(calls('impact')) == 3
    activity.get_by_role('button', name='Back', exact=True).click()
    activity.locator('.breathe').get_by_role('button', name='Start', exact=True).click()
    page.clock.run_for(50)
    assert len(calls('impact')) == 4
    page.evaluate('nativeListeners.appStateChange({isActive:false})')
    page.clock.run_for(12000)
    assert len(calls('impact')) == 4
    activity.locator('.breathe').get_by_role('button', name='Start', exact=True).click()
    page.clock.run_for(50)
    assert len(calls('impact')) == 5
    route('settings', 'Settings')
    page.clock.run_for(12000)
    assert len(calls('impact')) == 5
    page.get_by_role('button', name='Breathing haptics', exact=True).click()
    expect(page.get_by_role('button', name='Breathing haptics', exact=True)).to_have_attribute('aria-pressed', 'false')
    assert page.evaluate('localStorage.getItem("zuporta.haptics")') == 'off'
    print('PASS: inhale/exhale haptics; stop, step change, background and navigation clear timers; preference can disable (mocked bridge)', flush=True)

    # Deleting wellness history deliberately preserves independently controlled reminder preferences.
    page.evaluate("nativePermission = 'granted'")
    page.get_by_role('button', name='Enable daily reminder', exact=True).click()
    expect(page.get_by_role('button', name='Turn off reminder', exact=True)).to_be_visible()
    page.get_by_role('button', name='Delete My Wellness History', exact=True).click()
    page.locator('#sheet').get_by_role('button', name='Delete wellness history', exact=True).click()
    assert page.evaluate('JSON.parse(localStorage.getItem("zuporta.reminder")).enabled') is True
    assert page.evaluate('JSON.parse(localStorage.getItem("zuporta.v2.state")).responses') == []
    assert not errors, errors
    print('PASS: deletion scope matches privacy copy; no runtime errors in native bridge scenarios', flush=True)
    browser.close()
