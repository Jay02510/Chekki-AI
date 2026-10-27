"""Render Chekki English 1 answer pages to standalone HTML plus their answers.

Usage:
  python3 scripts/grading-eval/book_pages.py "<Chekki Textbook Series>/Build" scripts/grading-eval/pages

Reuses the book's own build.py (Content Bank -> HTML) so the eval sees the
real printed pages. Only pages where a child circles an answer are kept:
Picture Match (A/B/C picture), Which One? (A/B/C sentence), Yes / No, and
Challenge pages made of those. fill.mjs then draws the child's marks.
"""
import json, pathlib, sys, types

build_dir = pathlib.Path(sys.argv[1]).resolve()
out = pathlib.Path(sys.argv[2]).resolve()
out.mkdir(parents=True, exist_ok=True)

# build.py imports Playwright at the top for PDF output; HTML needs none of it.
stub = types.ModuleType('playwright.sync_api')
stub.sync_playwright = None
sys.modules['playwright'] = types.ModuleType('playwright')
sys.modules['playwright.sync_api'] = stub
sys.path.insert(0, str(build_dir / 'src'))
import build as B  # noqa: E402

B.FINAL = True
B.qr_svg = lambda url: '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#1F2430"/></svg>'  # QR library not needed here
ed = B.EDITIONS['ko-a4']
KINDS = {'Picture Match': 'pm', 'Review Picture Match': 'pm', 'Which One?': 'wo', 'Review Which One?': 'wo',
         'Yes / No': 'yn', 'Review Yes / No': 'yn'}
PAGE_ACTS = {'Picture Match', 'Which One?', 'Yes / No', 'Challenge'}

pages, items, vocab = B.load()
written = 0
for pid in sorted(pages):
    page = pages[pid]
    if page['Activity'] not in PAGE_ACTS:
        continue
    its = [i for i in items if i['Page ID'] == pid]
    if not its or any(i['Activity'] not in KINDS for i in its):
        continue
    html = B.document([B.render_page(page, items, vocab[pid[:3]], ed, B.book_page_of(pid))], ed)
    answers, n = [], 0
    for it in its:
        star = B.is_star(it)
        n += 0 if star else 1
        kind = KINDS[it['Activity']]
        a = {'n': '★' if star else str(n), 'kind': kind, 'sentence': it['Target sentence'],
             'answer': str(it['Answer position']).strip()}
        if kind == 'wo':
            others = [it['Sentence option 2 (Which One?)'], it['Sentence option 3 (Which One?)']]
            a['options'] = {k: (it['Target sentence'] if k == a['answer'] else others.pop(0)) for k in 'ABC'}
        answers.append(a)
    (out / f'{pid}.html').write_text(html)
    (out / f'{pid}.json').write_text(json.dumps({'pageId': pid, 'activity': page['Activity'], 'items': answers},
                                                ensure_ascii=False, indent=1))
    written += 1
print(f'wrote {written} pages to {out}')
