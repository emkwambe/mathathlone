"""
MathAthlone Static Question Auditor
=====================================
Audits all _static.json question files for:
  1. Math correctness — is the marked correct answer actually correct?
  2. Distractor quality — are wrong answers plausible (not trivially wrong)?
  3. Wording — is the question clear, complete, grade-appropriate?
  4. Answer key — does the explanation match the correct answer?

Usage:
  python scripts/static_question_auditor.py --course G7 --llm deepseek
  python scripts/static_question_auditor.py --all --llm deepseek
"""

import json, time, argparse, os, sys, urllib.request
from pathlib import Path

REPO = Path(r"C:\Users\HP\Documents\mathathlone-app")

STATIC_FILES = {
    "G6":   REPO / "docs/curriculum/grade6/NC_Grade_6_static.json",
    "G7":   REPO / "docs/curriculum/grade7/NC_Grade_7_static.json",
    "G8":   REPO / "docs/curriculum/grade8/NC_Grade_8_static.json",
    "ALG1": REPO / "docs/curriculum/algebra1/Alg1_static.json",
    "ALG2": REPO / "docs/curriculum/algebra-2/ALG2_static.json",
    "MF":   REPO / "docs/curriculum/math-fundamentals/MF_static.json",
    "NCM2": REPO / "docs/curriculum/nc-math2/NCM2_static.json",
    "NCM3": REPO / "docs/curriculum/nc-math3/NCM3_static.json",
    "APPC": REPO / "docs/curriculum/ap-precalc/APPC_static.json",
}

# ── LLM backends ──────────────────────────────────────────────────────────────

def call_deepseek(prompt: str, system: str) -> str:
    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY not set")
    payload = json.dumps({
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 500,
        "temperature": 0
    }).encode()
    req = urllib.request.Request(
        "https://api.deepseek.com/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data["choices"][0]["message"]["content"].strip()

def call_anthropic(prompt: str, system: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
    resp = client.messages.create(
        model="claude-sonnet-4-5", max_tokens=500,
        system=system,
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.content[0].text.strip()

LLM_BACKENDS = {"deepseek": call_deepseek, "anthropic": call_anthropic}

# ── Evaluation prompt ─────────────────────────────────────────────────────────

SYSTEM = """You are a strict K-12 mathematics education quality auditor.
Evaluate multiple choice questions for correctness, clarity, and quality.
Respond ONLY with valid JSON. No markdown, no text outside JSON."""

PROMPT = """Evaluate this multiple choice math question:

Question: {stem}
Options:
  A. {A}
  B. {B}
  C. {C}
  D. {D}
Marked correct answer: {correct}
Explanation provided: {explanation}

Tasks:
1. Independently solve the question
2. Verify the marked answer is correct
3. Check the explanation matches the correct answer
4. Evaluate distractor quality — are wrong answers plausible?
5. Check wording clarity and grade-appropriateness

Return ONLY this JSON:
{{
  "my_answer": "<your computed correct answer letter>",
  "is_correct": <true if marked answer matches your solution>,
  "confidence": "<high|medium|low>",
  "explanation_matches": <true if explanation supports the marked answer>,
  "distractor_quality": "<good|weak|trivial>",
  "distractor_note": "<what makes distractors weak or null>",
  "wording_ok": <true or false>,
  "wording_issue": "<specific problem or null>",
  "grade_appropriate": <true or false>,
  "grade_issue": "<issue or null>",
  "overall": "<pass|flag|fail>"
}}"""

# ── Load static file ──────────────────────────────────────────────────────────

def load_questions(course: str) -> list:
    path = STATIC_FILES.get(course)
    if not path or not path.exists():
        print(f"  File not found: {path}")
        return []
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
        # Handle both array and {questions: [...]} formats
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and 'questions' in data:
            return data['questions']
        else:
            print(f"  Unknown format in {path.name}")
            return []
    except Exception as e:
        print(f"  Parse error in {path.name}: {e}")
        return []

def parse_options(q: dict) -> dict:
    """Extract A/B/C/D options from various formats."""
    options = q.get('options', [])
    result = {'A': '', 'B': '', 'C': '', 'D': ''}
    
    if isinstance(options, list):
        for opt in options:
            opt = str(opt)
            for letter in ['A', 'B', 'C', 'D']:
                if opt.startswith(f'{letter}.') or opt.startswith(f'{letter})'):
                    result[letter] = opt[2:].strip()
                    break
            else:
                # No letter prefix — assign in order
                idx = options.index(opt) if opt in [str(o) for o in options] else -1
                if 0 <= idx < 4:
                    result[['A','B','C','D'][idx]] = opt
    elif isinstance(options, dict):
        for k, v in options.items():
            if k.upper() in result:
                result[k.upper()] = str(v)
    
    return result

# ── Audit ─────────────────────────────────────────────────────────────────────

def audit_course(course: str, llm: str) -> dict:
    questions = load_questions(course)
    if not questions:
        return {"course": course, "total": 0, "results": [], "summary": {}}
    
    print(f"\n{course}: {len(questions)} questions | Evaluator: {llm.upper()}")
    
    results = []
    passed = failed = flagged = errors = 0
    wrong_answers = []
    wording_issues = []
    weak_distractors = []

    for i, q in enumerate(questions):
        stem = q.get('stem', q.get('question', ''))
        correct = str(q.get('correct', q.get('correct_answer', ''))).strip().upper()
        explanation = q.get('explanation', q.get('rationale', ''))
        concept = q.get('concept_id', q.get('concept', ''))
        
        options = parse_options(q)
        
        # Skip if missing critical fields
        if not stem or not correct or not any(options.values()):
            print(f"  Q{i+1}: SKIP (missing fields)")
            errors += 1
            continue

        prompt = PROMPT.format(
            stem=stem[:300],
            A=options.get('A', '')[:100],
            B=options.get('B', '')[:100],
            C=options.get('C', '')[:100],
            D=options.get('D', '')[:100],
            correct=correct,
            explanation=str(explanation)[:200]
        )

        try:
            raw = LLM_BACKENDS[llm](prompt, SYSTEM)
            raw = raw.replace("```json", "").replace("```", "").strip()
            ev = json.loads(raw)
        except Exception as e:
            err = str(e)
            if any(x in err.lower() for x in ["credit","billing","402","payment"]):
                print(f"\n  ❌ API credits depleted")
                sys.exit(1)
            ev = {"error": err, "overall": "error"}
            errors += 1

        ev["question_index"] = i + 1
        ev["stem_preview"] = stem[:80]
        ev["concept"] = concept
        ev["correct_marked"] = correct
        results.append(ev)

        overall = ev.get("overall", "error")
        
        if "error" in ev:
            print(f"  Q{i+1}: ERROR — {ev.get('error','')[:50]}")
            errors += 1
        elif not ev.get("is_correct", True) and ev.get("confidence") == "high":
            failed += 1
            wrong_answers.append({
                "q": i+1, "concept": concept,
                "stem": stem[:80],
                "marked": correct,
                "should_be": ev.get("my_answer", "?"),
                "explanation": explanation[:100]
            })
            print(f"  Q{i+1}: ❌ WRONG — marked={correct} should={ev.get('my_answer','?')} | {stem[:50]}")
        elif overall == "flag" or not ev.get("wording_ok", True):
            flagged += 1
            if not ev.get("wording_ok", True):
                wording_issues.append({
                    "q": i+1, "concept": concept,
                    "stem": stem[:80],
                    "issue": ev.get("wording_issue", "")
                })
            print(f"  Q{i+1}: ⚠️  FLAG — {ev.get('wording_issue') or ev.get('distractor_note') or 'quality issue'}")
        else:
            passed += 1
            print(f"  Q{i+1}: ✅ ({concept})")

        if ev.get("distractor_quality") in ["weak", "trivial"]:
            weak_distractors.append({
                "q": i+1, "concept": concept,
                "note": ev.get("distractor_note", "")
            })

        time.sleep(0.3)

    summary = {
        "total": len(questions),
        "passed": passed,
        "failed": failed,
        "flagged": flagged,
        "errors": errors,
        "accuracy_pct": round(passed / max(len(questions), 1) * 100, 1),
        "wrong_answers": wrong_answers,
        "wording_issues": wording_issues,
        "weak_distractors": weak_distractors,
    }

    return {"course": course, "total": len(questions), "results": results, "summary": summary}

# ── Report ─────────────────────────────────────────────────────────────────────

def write_report(data: dict, path: str):
    s = data["summary"]
    lines = [
        f"# Static Question Audit — {data['course']}",
        f"**Date:** {time.strftime('%Y-%m-%d %H:%M')} | **Total questions:** {data['total']}\n",
        "## Summary\n",
        "| Metric | Value |", "|---|---|",
        f"| Total questions | {s['total']} |",
        f"| ✅ Passed | {s['passed']} |",
        f"| ❌ Wrong answer | {len(s['wrong_answers'])} |",
        f"| ⚠️ Flagged | {s['flagged']} |",
        f"| Pass rate | {s['accuracy_pct']}% |\n",
    ]

    if s["wrong_answers"]:
        lines += [f"## ❌ Wrong Answers — Fix Immediately\n"]
        for w in s["wrong_answers"]:
            lines += [
                f"### Q{w['q']} — `{w['concept']}`",
                f"- **Question:** {w['stem']}",
                f"- **Marked:** {w['marked']} | **Should be:** {w['should_be']}",
                f"- **Explanation:** {w['explanation']}\n",
            ]

    if s["wording_issues"]:
        lines += [f"\n## ⚠️ Wording Issues\n"]
        for w in s["wording_issues"]:
            lines += [
                f"- **Q{w['q']}** (`{w['concept']}`): {w['issue']}",
                f"  > {w['stem']}\n",
            ]

    if s["weak_distractors"]:
        lines += [f"\n## ⚠️ Weak Distractors\n"]
        for w in s["weak_distractors"]:
            lines.append(f"- **Q{w['q']}** (`{w['concept']}`): {w['note']}")

    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text("\n".join(lines), encoding="utf-8")
    print(f"\nReport: {path}")

# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", choices=list(STATIC_FILES.keys()))
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--llm", default="deepseek", choices=list(LLM_BACKENDS))
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    key_map = {"deepseek": "DEEPSEEK_API_KEY", "anthropic": "ANTHROPIC_API_KEY"}
    if not os.environ.get(key_map[args.llm]):
        print(f"ERROR: set {key_map[args.llm]}"); sys.exit(1)

    courses = list(STATIC_FILES.keys()) if args.all else [args.course]
    if not courses[0]:
        print("ERROR: specify --course or --all"); sys.exit(1)

    print(f"MathAthlone Static Question Auditor")
    print(f"Evaluator: {args.llm.upper()} | Courses: {', '.join(courses)}")

    for course in courses:
        data = audit_course(course, args.llm)
        out = args.output or str(
            REPO / "docs" / "audits" / f"{course}_static_audit.md"
        )
        if data["total"] > 0:
            write_report(data, out)
            s = data["summary"]
            print(f"\n{'='*50}")
            print(f"{course}: {s['passed']}/{s['total']} passed | "
                  f"{len(s['wrong_answers'])} wrong | "
                  f"{s['flagged']} flagged")
