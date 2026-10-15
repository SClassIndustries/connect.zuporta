"""Exercise web deep links and the real Sentry JS adapter against a synthetic native bridge."""
from pathlib import Path
import base64
import os
import subprocess
from playwright.sync_api import sync_playwright, expect

bundle = subprocess.check_output(['node', '--input-type=module', '-e', '''
import {build} from 'esbuild';
const result = await build({entryPoints:['src/monitoring.mjs'],write:false,bundle:true,format:'esm',platform:'browser',target:['ios15','chrome89'],minify:true,drop:['console','debugger'],define:{__ZUPORTA_SENTRY_DSN__:JSON.stringify('https://public@test.invalid/1'),__ZUPORTA_RELEASE__:JSON.stringify('synthetic-test-build')}});
process.stdout.write(result.outputFiles[0].text);
'''], text=True)
bridge = r"""
window.androidBridge = {}; window.nativeCalls = [];
const plugins = {
 App:['minimizeApp','getLaunchUrl'], LocalNotifications:['checkPermissions','cancel','createChannel','schedule'],
 Haptics:['impact'],Share:['share'],Browser:['open'],SystemBars:['setStyle'],
 SentryCapacitor:['initNativeSdk','closeNativeSdk','captureEnvelope','setUser','setTag','setExtra','setContext','clearBreadcrumbs','fetchNativeRelease','fetchNativeSdkInfo','fetchNativeDeviceContexts','fetchNativeLogAttributes','getStringBytesLength']
};
window.Capacitor = {
 PluginHeaders:Object.entries(plugins).map(([name,methods])=>({name,methods:[...methods.map(name=>({name,rtype:'promise'})),{name:'addListener',rtype:'callback'}]})),
 nativePromise:async(plugin,method,options)=>{
   nativeCalls.push({plugin,method,options});
   if(method==='checkPermissions')return {display:'prompt'};
   if(method==='initNativeSdk'||method==='captureEnvelope')return true;
   if(method==='fetchNativeRelease')return {id:'com.zuporta.plus',version:'1.0.0',build:'1'};
   if(method==='getStringBytesLength')return {value:new TextEncoder().encode(options.string).length};
   return {};
 },
 nativeCallback:()=> 'synthetic-listener'
};
"""
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('ZUPORTA_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
    context = browser.new_context(service_workers='block')
    context.route('https://api.zuporta.com/**', lambda route: route.abort())
    context.route('http://127.0.0.1:8000/open/**', lambda route: route.fulfill(status=200, content_type='text/html', body=Path('connect.zuporta.com/index.html').read_text()))
    page = context.new_page()
    for action, title in [('check-in', 'Home'), ('coaches', 'Professionals'), ('breathe', 'Zuporta+')]:
        page.goto('http://127.0.0.1:8000/open/' + action, wait_until='networkidle')
        expect(page.locator('#view-title')).to_have_text(title)
    print('PASS: all three web deep links resolve root assets and preserve their selected screen')
    context.close()
    context = browser.new_context(service_workers='block')
    context.add_init_script(bridge)
    context.route('https://api.zuporta.com/**', lambda route: route.abort())
    context.route('**/*.invalid/**', lambda route: route.abort())
    context.route('**/assets/js/monitoring.js', lambda route: route.fulfill(content_type='text/javascript', body=bundle))
    page = context.new_page()
    page.goto('http://127.0.0.1:8000/#/settings', wait_until='networkidle')
    assert page.evaluate('nativeCalls.filter(c=>c.plugin==="SentryCapacitor").length') == 0
    page.get_by_role('button', name='Enable diagnostics', exact=True).click()
    expect(page.get_by_role('button', name='Turn off diagnostics', exact=True)).to_be_visible()
    options = page.evaluate('nativeCalls.find(c=>c.method==="initNativeSdk").options.options')
    assert options['sendDefaultPii'] is False and options['maxBreadcrumbs'] == 0
    assert options['tracesSampleRate'] == 0 and options['enableCaptureFailedRequests'] is False
    page.get_by_role('button', name='Send a diagnostic check', exact=True).click()
    page.wait_for_function('nativeCalls.some(c=>c.method==="captureEnvelope")')
    envelope = page.evaluate('nativeCalls.find(c=>c.method==="captureEnvelope").options.envelope')
    payload = base64.b64decode(envelope).decode()
    assert 'Application error' in payload and 'Diagnostic connection check' not in payload
    page.get_by_role('button', name='Turn off diagnostics', exact=True).click()
    expect(page.get_by_role('button', name='Enable diagnostics', exact=True)).to_be_visible()
    assert page.evaluate('nativeCalls.some(c=>c.method==="closeNativeSdk")')
    print('PASS: real Sentry adapter waits for consent, uses restricted options, scrubs an error envelope and closes on opt-out (synthetic bridge; no events sent)')
    browser.close()
