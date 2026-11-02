"""Find an element on the simulator's screen by its accessibility label and tap it, long-press it or print its frame.

    python3 idb_ui.py <udid> tap   "<label words>"
    python3 idb_ui.py <udid> hold  "<label words>"      (a 0.9 s press)
    python3 idb_ui.py <udid> frame "<label words>"

A label starting with "=" must match exactly.

Uses Meta's idb (pip install fb-idb, plus idb_companion from Homebrew). Waits up to 6 s for the element.
"""
import json
import os
import subprocess
import sys
import time

IDB = os.environ.get('IDB', os.path.expanduser('~/Library/Python/3.9/bin/idb'))


def elements(udid):
    out = subprocess.run([IDB, 'ui', 'describe-all', '--udid', udid], capture_output=True, text=True).stdout
    try:
        return json.loads(out)
    except ValueError:
        return []


def main():
    udid, action, want = sys.argv[1], sys.argv[2], sys.argv[3].lower()
    # "=words" asks for the label exactly, so a short name never matches a longer line that holds it
    exact = want.startswith('=')
    want = want.lstrip('=')
    for _ in range(12):
        # the app itself carries its name as a label too: only what is drawn on the screen counts
        drawn = [e for e in elements(udid) if e.get('type') != 'Application']
        hit = [e for e in drawn if ((e.get('AXLabel') or '').lower() == want if exact else want in (e.get('AXLabel') or '').lower())]
        if hit:
            f = hit[0]['frame']
            if action == 'frame':
                print(json.dumps(f))
                return 0
            x, y = int(round(f['x'] + f['width'] / 2)), int(round(f['y'] + f['height'] / 2))
            duration = '0.9' if action == 'hold' else '0.12'
            subprocess.run([IDB, 'ui', 'tap', '--udid', udid, '--duration', duration, str(x), str(y)], check=True)
            print(f'{action} {want!r} at {x},{y}')
            return 0
        time.sleep(0.5)
    print(f'not found on screen: {want!r}', file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
