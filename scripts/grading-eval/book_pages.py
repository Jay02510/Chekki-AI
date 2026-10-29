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
# "Look and write" pages: the book's Picture Match sentences with the target
# word blanked out, for the child to write in by hand. The book has no such
# page, but hagwon worksheets do, and a written word (with a child's
# misspellings) is harder to grade than a circle.
WRITE_CSS = '''
.wp { padding: 18mm 18mm 12mm; }
.wp h1 { font: 700 20pt Andika; margin: 0; } .wp .ko { font: 11pt Pretendard; color: #6B7080; margin: 1mm 0 8mm; }
.witem { display: flex; align-items: center; gap: 8mm; padding: 5mm 0; border-bottom: 1px solid #D9D4CC; }
.witem .num { font: 700 14pt Andika; color: #fff; background: #8A76A7; border-radius: 50%; width: 9mm; height: 9mm;
  display: flex; align-items: center; justify-content: center; flex: none; }
.witem img { width: 42mm; height: 34mm; object-fit: contain; background: #F0F0F0; border-radius: 3mm; flex: none; }
.wsent { font: 400 22pt Andika; color: #1F2430; }
.wblank { display: inline-block; width: 42mm; border-bottom: 2px solid #1F2430; margin: 0 2mm; height: 1.1em; vertical-align: baseline; }
'''
for unit in ['U01', 'U02', 'U03', 'U04', 'U05']:
    pm = [i for i in items if i['Page ID'].startswith(unit + '-P') and i['Activity'] == 'Picture Match'
          and i.get('Target word') and str(i['Target sentence']).rstrip('.').endswith(str(i['Target word']))]
    for g in range(0, len(pm), 4):
        group, answers, rows = pm[g:g + 4], [], []
        for n, it in enumerate(group, 1):
            word, sent = str(it['Target word']), str(it['Target sentence'])
            lead = sent.rstrip('.')[: -len(word)].strip()
            rows.append(f'<div class="witem"><span class="num">{n}</span><img src="{B.img(it["Correct picture (asset)"])}">'
                        f'<div class="wsent">{B.e(lead)} <span class="wblank"></span>.</div></div>')
            answers.append({'n': str(n), 'kind': 'write', 'sentence': sent, 'answer': word})
        pid = f'{unit}-W{g // 4 + 1:02d}'
        doc = B.document([f'<div class="page right wp"><h1>Look and write.</h1><p class="ko">그림을 보고 빈칸에 알맞은 단어를 쓰세요.</p>{"".join(rows)}</div>'], ed)
        (out / f'{pid}.html').write_text(doc.replace('</style>', WRITE_CSS + '</style>', 1))
        (out / f'{pid}.json').write_text(json.dumps({'pageId': pid, 'activity': 'Look and write', 'items': answers},
                                                    ensure_ascii=False, indent=1))
        written += 1
print(f'wrote {written} pages to {out}')
