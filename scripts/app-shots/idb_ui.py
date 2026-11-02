"""Find an element on the simulator's screen by its accessibility label and tap it, long-press it or print its frame.

    python3 idb_ui.py <udid> tap   "<label words>"
    python3 idb_ui.py <udid> hold  "<label words>"      (a 0.9 s press)
    python3 idb_ui.py <udid> frame "<label words>"
    python3 idb_ui.py <udid> labels                      (every label on screen, to find one)

A label starting with "=" must match exactly. Waits up to WAIT seconds (default 6) for the element. Every call to idb
has its own time limit, so a stuck simulator never holds the run.

Uses Meta's idb (pip install fb-idb, plus idb_companion from Homebrew).
"""
import json
import os
import subprocess
import sys
import time

IDB = os.environ.get('IDB', os.path.expanduser('~/Library/Python/3.9/bin/idb'))
WAIT = float(os.environ.get('WAIT', '6'))


def elements(udid):
    try:
        out = subprocess.run([IDB, 'ui', 'describe-all', '--udid', udid], capture_output=True, text=True, timeout=20).stdout
        return json.loads(out)
    except (ValueError, subprocess.TimeoutExpired):
        return []


def main():
    udid, action = sys.argv[1], sys.argv[2]
    if action == 'labels':
        for e in elements(udid):
            if e.get('AXLabel'):
                f = e.get('frame', {})
                print(f"{e.get('type')}\t{e['AXLabel']!r}\t{f.get('x', 0):.0f},{f.get('y', 0):.0f} {f.get('width', 0):.0f}x{f.get('height', 0):.0f}")
        return 0
    want = sys.argv[3].lower()
    # "=words" asks for the label exactly, so a short name never matches a longer line that holds it
    exact = want.startswith('=')
    want = want.lstrip('=')
    until = time.time() + WAIT
    while True:
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
            subprocess.run([IDB, 'ui', 'tap', '--udid', udid, '--duration', duration, str(x), str(y)], check=True, timeout=20)
            print(f'{action} {want!r} at {x},{y}')
            return 0
        if time.time() > until:
            break
        time.sleep(0.5)
    print(f'not found on screen: {want!r}', file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
