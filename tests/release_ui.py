"""Browser regression checks for the release UI; use a local static server."""
from playwright.sync_api import sync_playwright, expect
import json
import os
ORIGIN=os.environ.get('ZUPORTA_TEST_ORIGIN', 'http://127.0.0.1:8000')
KEY='zuporta.v2.state'
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('ZUPORTA_CHROMIUM', '/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
    context.route('https://api.zuporta.com/**',lambda route:route.abort())
    page=context.new_page()
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(ORIGIN,wait_until='networkidle')
    def route(name,title=None):
        page.evaluate('(name)=>location.hash="#/"+name',name)
        if title: expect(page.locator('#view-title')).to_have_text(title)
        page.wait_for_timeout(80)
    def stored(): return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
    expect(page.locator('#view')).to_contain_text('0 days in the past 7 days')
    assert 'available now' not in page.locator('#view').inner_text().lower()
    route('modules','Modules')
    expect(page.locator('#view').get_by_role('button',name='Open',exact=True)).to_have_count(1)
    expect(page.locator('#view')).to_contain_text('Personal Baseline')
    assert 'pilot' not in page.locator('#view').inner_text().lower()
    for name in ['m/caregiver','m/career','m/nightshift','m/parentbridge','m/nurseguide','m/navigator','programs','plus','__proto__','constructor']:
        route(name,'Home')
        assert 'prototype' not in page.locator('#view').inner_text().lower()
    print('PASS: only functional tool exposed; hidden and unknown routes fall back safely',flush=True)
    route('wellness','My Wellness')
    expect(page.locator('#view')).to_contain_text('No guided activities recorded yet.')
    expect(page.locator('.spark__col')).to_have_count(0)
    route('sessions','Sessions')
    expect(page.locator('#view')).to_contain_text('Your completed guided activities will appear here.')
    route('professionals','Professionals')
    expect(page.locator('#view .pro')).to_have_count(0)
    expect(page.get_by_role('link',name='Browse coaches')).to_have_attribute('href','https://zuporta.com/coaches')
    print('PASS: no sample coach profiles, wellness data or session history',flush=True)
    route('home','Home')
    page.get_by_role('button',name='Good',exact=True).click()
    page.get_by_role('button',name='Great',exact=True).click()
    expect(page.locator('#view')).to_contain_text('1 day in the past 7 days')
    assert len(stored()['checkIns'])==2
    route('settings','Settings')
    page.get_by_role('button',name='Manage permissions').click()
    sheet=page.locator('#sheet')
    expect(sheet.get_by_role('button',name='Off',exact=True)).to_have_count(1)
    assert 'Contribute to wellness research' not in sheet.inner_text()
    assert 'Share with my professional' not in sheet.inner_text()
    sheet.get_by_role('button',name='Off',exact=True).click()
    assert stored()['consent']=={'personalize':True}
    sheet.get_by_role('button',name='Close',exact=True).click()
    print('PASS: mood count uses unique real days; only implemented preference is available',flush=True)
    # Complete the actual guided interaction, including an explicit after score.
    route('home','Home')
    page.locator('#view').get_by_role('button',name='Start',exact=True).click()
    expect(page.locator('#view-title')).to_have_text('Zuporta+')
    page.get_by_role('button',name='6 out of 10',exact=True).last.click()
    page.locator('#view .quick:enabled').first.click()
    activity=page.locator('.wcard--activity').last
    expect(activity).to_be_visible()
    while activity.get_by_role('button',name='Next',exact=True).count():
        activity.get_by_role('button',name='Next',exact=True).click()
    activity.get_by_role('button',name='Finish',exact=True).click()
    page.get_by_role('button',name='After: 5 out of 10',exact=True).click()
    page.get_by_role('button',name='A little better',exact=True).click()
    page.get_by_role('button',name='Nothing yet',exact=True).click()
    page.wait_for_function('(key)=>JSON.parse(localStorage.getItem(key)).responses.length===1',arg=KEY)
    assert stored()['responses'][0]['before']==6
    assert stored()['responses'][0]['after']==5
    assert stored()['responses'][0]['helpful'] is True
    route('sessions','Sessions')
    expect(page.locator('#view')).to_contain_text('6/10 → 5/10')
    route('wellness','My Wellness')
    expect(page.locator('#view')).to_contain_text('1 of your last 1 guided interaction was rated helpful.')
    print('PASS: guided activity records actual before/after ratings and renders real history',flush=True)
    # Legacy preferences are removed while wellness and hidden module records survive.
    page.evaluate('''(key)=>{const s=JSON.parse(localStorage.getItem(key));s.consent={personalize:true,research:true,professional:true,model:true};s.modules={caregiver:{plan:{action:'preserved private plan'}}};localStorage.setItem(key,JSON.stringify(s));}''',KEY)
    page.reload(wait_until='networkidle')
    assert stored()['consent']=={'personalize':True}
    assert stored()['modules']['caregiver']['plan']['action']=='preserved private plan'
    assert len(stored()['responses'])==1
    print('PASS: legacy consent migration preserves wellness and archived module records',flush=True)
    # Personalization must change an actual suggestion, and off must restore the default.
    page.evaluate('''(key)=>{const s=JSON.parse(localStorage.getItem(key));s.responses.unshift({at:Date.now(),activity:'Grounding Reset',before:6,after:5,helpful:true});localStorage.setItem(key,JSON.stringify(s));}''',KEY)
    page.reload(wait_until='networkidle')
    route('home','Home')
    expect(page.locator('#view')).to_contain_text('Grounding Reset')
    page.locator('#view').get_by_role('button',name='Start',exact=True).click()
    page.get_by_role('button',name='6 out of 10',exact=True).last.click()
    page.get_by_role('button',name='Something personal',exact=True).and_(page.locator('button:enabled')).last.click()
    expect(page.locator('.wcard--activity').last).to_contain_text('Grounding Reset')
    route('settings','Settings')
    page.get_by_role('button',name='Manage permissions').click()
    page.locator('#sheet').get_by_role('button',name='On',exact=True).click()
    page.locator('#sheet').get_by_role('button',name='Close',exact=True).click()
    route('home','Home')
    expect(page.locator('#view')).to_contain_text('3-Minute Reset')
    assert 'Grounding Reset' not in page.locator('#view').inner_text()
    print('PASS: personalization changes the suggestion and launches that activity; off restores default',flush=True)
    # Seed just baseline numbers to reach a meaningful adverse-change scenario quickly.
    page.evaluate('''(key)=>{const s=JSON.parse(localStorage.getItem(key));const values={mood:5,sleep:5,stress:1,focus:5,energy:5,functioning:5};s.modules.baseline={stage:'landing',consent:true,checkins:[{at:Date.now()-3000,values},{at:Date.now()-4000,values},{at:Date.now()-5000,values}],draft:{},flagged:null,confirmed:null,supportKind:null,measured:null};localStorage.setItem(key,JSON.stringify(s));}''',KEY)
    page.reload(wait_until='networkidle')
    route('m/baseline','Personal Baseline')
    page.get_by_role('button',name='Check in now',exact=True).click()
    for label,score in [('Mood',1),('Sleep',1),('Stress',5),('Focus',1),('Energy',1),('Getting things done',1)]:
        page.get_by_role('button',name=f'{label}: {score} of 5',exact=True).click()
    page.get_by_role('button',name='Save check-in',exact=True).click()
    expect(page.locator('#view')).to_contain_text('Does this match how you feel?')
    page.get_by_role('button',name='Yes, that is how it feels',exact=True).click()
    page.get_by_role('button',name='Choose',exact=True).nth(0).click()
    expect(page.locator('#view-title')).to_have_text('Zuporta+')
    expect(page.get_by_role('button',name='6 out of 10',exact=True).last).to_be_visible()
    route('m/baseline','Personal Baseline')
    page.get_by_role('button',name='Not finished yet',exact=True).click()
    page.get_by_role('button',name='Record how your support went',exact=True).click()
    page.get_by_role('button',name='A little better',exact=True).click()
    assert stored()['modules']['baseline']['measured']==3
    print('PASS: baseline detects a change, confirms it, launches real support and records follow-up',flush=True)
    # Re-open the support stage to verify its coach choice also navigates.
    page.evaluate('''(key)=>{const s=JSON.parse(localStorage.getItem(key));s.modules.baseline.stage='support';localStorage.setItem(key,JSON.stringify(s));}''',KEY)
    page.reload(wait_until='networkidle')
    page.get_by_role('button',name='Choose',exact=True).nth(1).click()
    expect(page.locator('#view-title')).to_have_text('Professionals')
    print('PASS: baseline coach action opens actual directory',flush=True)
    # PWA shell must load when network is disabled.
    page.wait_for_function('!!navigator.serviceWorker.controller')
    context.set_offline(True)
    page.reload(wait_until='domcontentloaded')
    expect(page.locator('#view')).not_to_be_empty()
    route('m/baseline','Personal Baseline')
    expect(page.locator('#view')).to_contain_text('Did that help?')
    context.set_offline(False)
    print('PASS: service worker reload and retained baseline work offline in Chromium',flush=True)
    route('settings','Settings')
    page.get_by_role('button',name='Delete My Wellness History',exact=True).click()
    page.locator('#sheet').get_by_role('button',name='Delete wellness history',exact=True).click()
    state=stored()
    assert state['responses']==[] and state['events']==[] and state['checkIns']==[]
    assert state['followups']==[] and state.get('modules') is None
    assert page.evaluate('JSON.parse(localStorage.getItem("zuporta.analytics"))')==[]
    print('PASS: history deletion clears baseline, archived module records and local activity log',flush=True)
    assert not errors,errors
    print('PASS: no browser runtime errors across release UI scenarios',flush=True)
    # Exercise the success path with an explicitly synthetic API fixture.
    fixture_context=browser.new_context(reduced_motion='reduce')
    fixture_context.route('https://api.zuporta.com/**',lambda route:route.fulfill(
        status=200,headers={'Access-Control-Allow-Origin':'*'},content_type='application/json',
        body=json.dumps({'data':{'items':[{'id':'fixture-coach','name':'API Fixture Coach','online':True,'specialities':['Stress'],'bio':'Synthetic test fixture','price_15_min':25}],'has_more_pages':False}})))
    fixture_page=fixture_context.new_page()
    fixture_page.on('pageerror',lambda error:errors.append(str(error)))
    fixture_page.goto(ORIGIN+'/#/professionals',wait_until='networkidle')
    expect(fixture_page.locator('#view .pro')).to_have_count(1)
    expect(fixture_page.locator('#view')).to_contain_text('API Fixture Coach')
    expect(fixture_page.get_by_role('link',name='Connect Now',exact=True)).to_have_attribute('href','https://zuporta.com/coaches')
    assert not errors, errors
    print('PASS: successful directory response renders coach data and a working booking link (mocked API)',flush=True)
    browser.close()
