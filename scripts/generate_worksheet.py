"""
MathAthlone Generator Worksheet Generator
==========================================
Generates a visual HTML worksheet showing questions + answers
from all generators for a course — for human expert review.

Usage:
  python scripts/generate_worksheet.py --course G7 --samples 3
  
Opens an HTML file you can review in browser. Each question shows:
  - Question text (as student sees it)
  - Correct answer (highlighted)
  - Solution steps
  - Answer type
  - Difficulty level
  - A CORRECT / WRONG checkbox for your manual review
"""

import subprocess, json, argparse, os, sys, time
from pathlib import Path

REPO = Path(r"C:\Users\HP\Documents\mathathlone-app")
PREFIXES = {
    "G6":"g6_", "G7":"g7_", "G8":"g8_",
    "ALG1":"alg1_", "MF":"mf_", "NCM3":"m3_"
}

COURSE_INFO = {
    "G6": ("NC Grade 6 Math", "Rising Stars", "#6366f1"),
    "G7": ("NC Grade 7 Math", "Challengers",  "#8b5cf6"),
    "G8": ("NC Grade 8 Math", "Contenders",   "#3b82f6"),
    "ALG1": ("Algebra 1",    "Varsity",        "#10b981"),
    "MF":   ("Math Fundamentals", "Foundation","#f59e0b"),
    "NCM3": ("NC Math 3",   "Senior Varsity",  "#ef4444"),
}

def sample_generators(prefix: str, spd: int) -> list:
    script = str(REPO / "scripts" / "sample-generators.ts")
    cmd = f"npx tsx {script} {prefix} {spd}"
    r = subprocess.run(cmd, cwd=str(REPO), capture_output=True,
                       encoding='utf-8', errors='replace',
                       timeout=180, shell=True)
    if r.returncode != 0:
        print(f"Sampler error: {r.stderr[:200]}")
        return []
    try:
        return json.loads(r.stdout.strip())
    except Exception as e:
        print(f"JSON parse error: {e}")
        return []

DIFF_LABELS = {1:"🟢 Easy", 2:"🟡 Medium", 3:"🟠 Hard", 4:"🔴 Expert"}
DIFF_COLORS = {1:"#dcfce7", 2:"#fef9c3", 3:"#ffedd5", 4:"#fee2e2"}

def build_html(course: str, samples: list) -> str:
    name, division, color = COURSE_INFO.get(course, (course, "", "#6366f1"))
    
    # Group by generator
    by_gen: dict = {}
    for s in samples:
        gt = s.get("generator_type","?")
        by_gen.setdefault(gt, []).append(s)

    total = len(samples)
    gen_count = len(by_gen)
    date = time.strftime('%B %d, %Y')

    # Build question cards
    cards_html = ""
    q_num = 0
    
    for gt, slist in by_gen.items():
        # Generator header
        cards_html += f"""
        <div class="gen-section">
          <div class="gen-header" style="border-left: 4px solid {color}">
            <div class="gen-name">{gt}</div>
            <div class="gen-meta">{len(slist)} samples · click ✓/✗ to mark</div>
          </div>
        """
        
        for s in slist:
            q_num += 1
            diff = s.get('difficulty', 1)
            diff_label = DIFF_LABELS.get(diff, f"D{diff}")
            diff_color = DIFF_COLORS.get(diff, "#f3f4f6")
            answer = s.get('answer', '')
            question = s.get('question', '')
            answer_type = s.get('answer_type', '')
            steps = s.get('solution_steps', [])
            
            steps_html = ""
            if steps:
                steps_html = "<ol class='steps'>" + \
                    "".join(f"<li>{step}</li>" for step in steps) + \
                    "</ol>"
            
            cards_html += f"""
          <div class="q-card" id="q{q_num}">
            <div class="q-header">
              <span class="q-num">Q{q_num}</span>
              <span class="diff-badge" style="background:{diff_color}">{diff_label}</span>
              <span class="type-badge">{answer_type}</span>
              <div class="review-btns">
                <button class="btn-correct" onclick="markQ({q_num},'correct')" title="Mark correct">✓ Correct</button>
                <button class="btn-wrong" onclick="markQ({q_num},'wrong')" title="Mark wrong">✗ Wrong</button>
                <button class="btn-wording" onclick="markQ({q_num},'wording')" title="Wording issue">⚠ Wording</button>
              </div>
            </div>
            <div class="q-text">{question}</div>
            <div class="answer-row">
              <span class="answer-label">Answer:</span>
              <span class="answer-value">{answer}</span>
              <span class="answer-type">({answer_type})</span>
            </div>
            {f'<details class="steps-toggle"><summary>Solution steps</summary>{steps_html}</details>' if steps else ''}
            <div class="q-note" id="note{q_num}" style="display:none">
              <input type="text" placeholder="Note what's wrong..." 
                     onchange="addNote({q_num}, this.value)"
                     style="width:100%;padding:6px;border:1px solid #fca5a5;border-radius:4px;font-size:13px">
            </div>
          </div>
            """
        
        cards_html += "</div>"  # close gen-section

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MathAthlone Worksheet — {course}</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f8fafc; color: #1e293b; }}
  
  .header {{ background: {color}; color: white; padding: 24px 32px; }}
  .header h1 {{ font-size: 24px; font-weight: 700; }}
  .header .meta {{ font-size: 14px; opacity: 0.85; margin-top: 4px; }}
  .header .stats {{ display: flex; gap: 24px; margin-top: 16px; }}
  .stat {{ background: rgba(255,255,255,0.15); 
           border-radius: 8px; padding: 8px 16px; text-align: center; }}
  .stat-val {{ font-size: 22px; font-weight: 700; }}
  .stat-lbl {{ font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; }}
  
  .toolbar {{ background: white; border-bottom: 1px solid #e2e8f0;
              padding: 12px 32px; display: flex; gap: 12px; align-items: center;
              position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
  .toolbar button {{ padding: 6px 14px; border-radius: 6px; border: 1px solid #e2e8f0;
                     cursor: pointer; font-size: 13px; font-weight: 500; }}
  .toolbar .t-correct {{ background: #dcfce7; color: #15803d; border-color: #86efac; }}
  .toolbar .t-wrong {{ background: #fee2e2; color: #dc2626; border-color: #fca5a5; }}
  .toolbar .t-wording {{ background: #fef9c3; color: #ca8a04; border-color: #fde047; }}
  .score-display {{ margin-left: auto; font-weight: 600; font-size: 14px; color: #64748b; }}
  
  .main {{ max-width: 900px; margin: 24px auto; padding: 0 16px; }}
  
  .gen-section {{ margin-bottom: 32px; }}
  .gen-header {{ background: white; border-radius: 8px; padding: 12px 16px;
                 margin-bottom: 8px; display: flex; align-items: center;
                 justify-content: space-between; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }}
  .gen-name {{ font-family: monospace; font-weight: 600; font-size: 14px; color: #1e293b; }}
  .gen-meta {{ font-size: 12px; color: #94a3b8; }}
  
  .q-card {{ background: white; border-radius: 10px; padding: 16px;
             margin-bottom: 10px; border: 2px solid transparent;
             box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: border-color 0.2s; }}
  .q-card.correct {{ border-color: #86efac; background: #f0fdf4; }}
  .q-card.wrong {{ border-color: #fca5a5; background: #fff5f5; }}
  .q-card.wording {{ border-color: #fde047; background: #fefce8; }}
  
  .q-header {{ display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }}
  .q-num {{ font-weight: 700; font-size: 13px; color: #64748b; min-width: 28px; }}
  .diff-badge {{ font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }}
  .type-badge {{ font-size: 11px; padding: 2px 8px; border-radius: 10px;
                 background: #f1f5f9; color: #475569; font-family: monospace; }}
  .review-btns {{ margin-left: auto; display: flex; gap: 6px; }}
  .btn-correct, .btn-wrong, .btn-wording {{ padding: 4px 10px; border-radius: 6px;
    border: 1px solid; cursor: pointer; font-size: 12px; font-weight: 500; }}
  .btn-correct {{ background: #dcfce7; color: #16a34a; border-color: #86efac; }}
  .btn-wrong {{ background: #fee2e2; color: #dc2626; border-color: #fca5a5; }}
  .btn-wording {{ background: #fef9c3; color: #ca8a04; border-color: #fde047; }}
  
  .q-text {{ font-size: 16px; font-weight: 500; margin-bottom: 12px;
             line-height: 1.5; color: #0f172a; }}
  .answer-row {{ display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
                 padding: 8px 12px; background: #f8fafc; border-radius: 6px; }}
  .answer-label {{ font-size: 12px; color: #64748b; font-weight: 500; text-transform: uppercase; }}
  .answer-value {{ font-size: 18px; font-weight: 700; color: #1d4ed8;
                   font-family: monospace; }}
  .answer-type {{ font-size: 11px; color: #94a3b8; font-family: monospace; }}
  
  .steps-toggle {{ margin-top: 8px; }}
  .steps-toggle summary {{ font-size: 12px; color: #94a3b8; cursor: pointer; 
                           padding: 4px 0; user-select: none; }}
  .steps {{ margin-top: 8px; padding-left: 20px; }}
  .steps li {{ font-size: 13px; color: #475569; margin-bottom: 4px; line-height: 1.4; }}
  
  .q-note {{ margin-top: 8px; }}
  
  .export-section {{ background: white; border-radius: 10px; padding: 20px;
                     margin: 24px 0; text-align: center; border: 2px dashed #e2e8f0; }}
  .export-btn {{ background: {color}; color: white; border: none; padding: 10px 24px;
                 border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }}
  
  @media print {{
    .toolbar, .review-btns, .export-section {{ display: none; }}
    .q-card {{ break-inside: avoid; border: 1px solid #e2e8f0; }}
    body {{ background: white; }}
  }}
</style>
</head>
<body>

<div class="header">
  <h1>🔥 MathAthlone — Generator Review Worksheet</h1>
  <div class="meta">{name} · {division} Division · {date}</div>
  <div class="stats">
    <div class="stat"><div class="stat-val">{gen_count}</div><div class="stat-lbl">Generators</div></div>
    <div class="stat"><div class="stat-val">{total}</div><div class="stat-lbl">Questions</div></div>
    <div class="stat"><div class="stat-val" id="correct-count">0</div><div class="stat-lbl">✓ Correct</div></div>
    <div class="stat"><div class="stat-val" id="wrong-count">0</div><div class="stat-lbl">✗ Wrong</div></div>
    <div class="stat"><div class="stat-val" id="wording-count">0</div><div class="stat-lbl">⚠ Wording</div></div>
  </div>
</div>

<div class="toolbar">
  <span style="font-size:13px;font-weight:600;color:#64748b">Quick mark all:</span>
  <button class="t-correct" onclick="markAll('correct')">✓ All Correct</button>
  <button class="t-wrong" onclick="markAll('wrong')">✗ Mark Wrong</button>
  <button onclick="exportResults()" style="background:#f1f5f9">📋 Export Issues</button>
  <button onclick="window.print()" style="background:#f1f5f9">🖨️ Print</button>
  <div class="score-display" id="progress">0 / {total} reviewed</div>
</div>

<div class="main">
{cards_html}

<div class="export-section">
  <p style="color:#64748b;margin-bottom:12px;font-size:14px">
    Export your review results to send to Claude Code for fixes
  </p>
  <button class="export-btn" onclick="exportResults()">📋 Export Issues for Claude Code</button>
  <div id="export-output" style="margin-top:16px;display:none;text-align:left"></div>
</div>
</div>

<script>
const reviews = {{}};
const notes = {{}};
let reviewed = 0;

function markQ(num, type) {{
  const card = document.getElementById('q' + num);
  const noteDiv = document.getElementById('note' + num);
  const wasReviewed = reviews[num];
  
  // Toggle off if same type clicked again
  if (reviews[num] === type) {{
    card.className = 'q-card';
    delete reviews[num];
    noteDiv.style.display = 'none';
    if (wasReviewed) reviewed--;
  }} else {{
    card.className = 'q-card ' + type;
    if (!wasReviewed) reviewed++;
    reviews[num] = type;
    noteDiv.style.display = (type === 'wrong' || type === 'wording') ? 'block' : 'none';
  }}
  
  updateCounts();
}}

function addNote(num, val) {{
  notes[num] = val;
}}

function updateCounts() {{
  const correct = Object.values(reviews).filter(v=>v==='correct').length;
  const wrong   = Object.values(reviews).filter(v=>v==='wrong').length;
  const wording = Object.values(reviews).filter(v=>v==='wording').length;
  document.getElementById('correct-count').textContent = correct;
  document.getElementById('wrong-count').textContent = wrong;
  document.getElementById('wording-count').textContent = wording;
  document.getElementById('progress').textContent = 
    reviewed + ' / {total} reviewed';
}}

function markAll(type) {{
  // Only mark unreviewed questions
  for (let i = 1; i <= {total}; i++) {{
    if (!reviews[i]) markQ(i, type);
  }}
}}

function exportResults() {{
  const issues = [];
  document.querySelectorAll('.q-card').forEach(card => {{
    const num = parseInt(card.id.replace('q',''));
    const review = reviews[num];
    if (review === 'wrong' || review === 'wording') {{
      const question = card.querySelector('.q-text')?.textContent;
      const answer = card.querySelector('.answer-value')?.textContent;
      const genSection = card.closest('.gen-section');
      const genName = genSection?.querySelector('.gen-name')?.textContent;
      const note = notes[num] || '';
      issues.push({{
        q: num, generator: genName, type: review,
        question: question?.trim(), answer: answer?.trim(), note
      }});
    }}
  }});
  
  const output = document.getElementById('export-output');
  output.style.display = 'block';
  
  if (issues.length === 0) {{
    output.innerHTML = '<div style="color:#16a34a;font-weight:600;padding:12px;background:#dcfce7;border-radius:8px">✅ No issues found! All generators look correct.</div>';
    return;
  }}
  
  let report = '## Generator Issues Found\\n\\n';
  issues.forEach(i => {{
    report += `### Q${{i.q}} — \`${{i.generator}}\` (${{i.type.toUpperCase()}})\\n`;
    report += `- Question: ${{i.question}}\\n`;
    report += `- Answer: \`${{i.answer}}\`\\n`;
    if (i.note) report += `- Note: ${{i.note}}\\n`;
    report += '\\n';
  }});
  
  output.innerHTML = `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px">
      <div style="font-weight:600;margin-bottom:8px;color:#dc2626">
        ${{issues.length}} issue(s) found — copy and send to Claude Code:
      </div>
      <textarea readonly style="width:100%;height:200px;font-family:monospace;font-size:12px;
        border:1px solid #e2e8f0;border-radius:6px;padding:8px">${{report}}</textarea>
      <button onclick="navigator.clipboard.writeText(document.querySelector('textarea').value)"
        style="margin-top:8px;padding:6px 14px;background:#1e293b;color:white;
        border:none;border-radius:6px;cursor:pointer;font-size:13px">
        📋 Copy to clipboard
      </button>
    </div>`;
}}
</script>
</body>
</html>"""
    return html

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate visual review worksheet for MathAthlone generators"
    )
    parser.add_argument("--course", required=True, choices=list(PREFIXES))
    parser.add_argument("--samples", type=int, default=3,
                        help="Samples per difficulty level (default 3 = 12 per generator)")
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    prefix = PREFIXES[args.course]
    print(f"Generating worksheet for {args.course} ({args.samples} samples/difficulty)...")

    samples = sample_generators(prefix, args.samples)
    if not samples:
        print("No samples generated. Check your generators.ts file.")
        sys.exit(1)

    print(f"Got {len(samples)} questions from {len(set(s.get('generator_type') for s in samples))} generators")

    html = build_html(args.course, samples)
    out = args.output or str(
        REPO / "docs" / "audits" / f"{args.course}_worksheet.html"
    )
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(html, encoding="utf-8")

    print(f"\nWorksheet saved: {out}")
    print(f"Opening in browser...")

    import subprocess
    subprocess.run(f'start "" "{out}"', shell=True)
    print(f"\nInstructions:")
    print(f"  ✓ Correct  — question and answer are both right")
    print(f"  ✗ Wrong    — answer is mathematically incorrect")
    print(f"  ⚠ Wording  — question text is unclear or has errors")
    print(f"\nClick 'Export Issues' when done to get a report for Claude Code.")
