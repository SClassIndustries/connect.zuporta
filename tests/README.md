# Release UI regression checks

Requires Python 3 and Chromium. Install the pinned browser driver with
`python3 -m pip install -r tests/requirements.txt`. On this cloud image,
Chromium is already available at `/usr/bin/chromium`; alternatively point
`ZUPORTA_CHROMIUM` at an installed Chromium executable.

From the repository root, start the app in a separate terminal:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory connect.zuporta.com
```

Then run:

```sh
python3 tests/release_ui.py
```

Set `ZUPORTA_TEST_ORIGIN` if using another local port. The checks use a
fresh mobile browser context, block the coach API for failure/offline
scenarios, and use an explicitly synthetic API response for the directory
success scenario. They never book a session or send messages to Zuporta.

The checks cover release route restrictions, empty states, mood history,
actual guided activity ratings, consent migration, personalization on/off,
retained hidden-module data, baseline change confirmation and real support
navigation, service worker offline reload, wellness-data deletion and
browser runtime errors. They validate the web app in Chromium; they do not
replace native iOS/Android device QA or prove live API availability.
