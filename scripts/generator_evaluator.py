"""
MathAthlone Generator Quality Evaluator
Calls sample-generators.ts via npx tsx, then evaluates with Claude API.

Usage:
  python scripts/generator_evaluator.py --course G7 --samples 5
  python scripts/generator_evaluator.py --course G7 --samples 10 --output docs/audits/G7_audit.md
"""

import subprocess, json, time, argparse, os, sys
from pathlib import Path

REPO = Path(r"C:\Users\HP\Documents\mathathlone-app")
API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
PREFIXES = {
    "G6":"g6_", "G7":"g7_", "G8":"g8_",
    "ALG1":"alg1_", "MF":"mf_", "NCM3":"m3_"
}

def sample_generators(prefix: str, spd: int) -> list:
    """Run the TypeScript sampler and return all samples as a list."""
    script = str(REPO / "scripts" / "sample-generators.ts")
    cmd = f"npx tsx {script} {prefix} {spd}"
    # encoding='utf-8' with errors='replace' so the sampler's Unicode
    # output (math symbols, smart quotes, etc.) doesn't crash the script
    # on a Windows console whose default codepage isn't UTF-8.
    r = subprocess.run(cmd, cwd=str(REPO), capture_output=True,
                       encoding='utf-8', errors='replace',
                       timeout=120, shell=True)
    if r.returncode != 0:
        print(f"  Sampler error: {r.stderr[:200]}")
        return []
    try:
        return json.loads(r.stdout.strip())
    except Exception as e:
        print(f"  JSON parse error: {e} | output: {r.stdout[:100]}")
        return []

SYSTEM = """You are a mathematics education quality auditor.
Given a math question and the generator's answer, independently solve it.
Respond ONLY with valid JSON — no markdown, no text outside JSON."""

def evaluate(sample: dict, course: str) -> dict:
    import anthropic
    client = anthropic.Anthropic(api_key=API_KEY)
    prompt = f"""Evaluate this math generator output:

Question: {sample.get('question','')}
Generator answer: {sample.get('answer','')}
Answer type: {sample.get('answer_type','')}
Difficulty (1-4): {sample.get('difficulty','')}
Course: {course}
Concept: {sample.get('concept_name','')}

Return exactly this JSON (no other text):
{{
  "my_answer": "<your computed answer>",
  "is_correct": true,
  "confidence": "high",
  "format_ok": true,
  "format_note": null,
  "quality": "good",
  "quality_note": null
}}"""
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-20250514", max_tokens=300,
            system=SYSTEM,
            messages=[{"role":"user","content":prompt}]
        )
        raw = resp.content[0].text.strip().replace("```json","").replace("```","").strip()
        ev = json.loads(raw)
        ev["sample"] = sample
        return ev
    except Exception as e:
        return {"error": str(e), "sample": sample}

def evaluate_course(course: str, spd: int) -> dict:
    prefix = PREFIXES[course]
    print(f"\nSampling {course} generators (prefix={prefix}, {spd} samples/difficulty)...")
    samples = sample_generators(prefix, spd)
    
    # Group by generator_type
    by_gen: dict = {}
    for s in samples:
        gt = s.get("generator_type","?")
        by_gen.setdefault(gt, []).append(s)
    
    print(f"{course}: {len(by_gen)} generators, {len(samples)} total samples")
    
    report = {
        "course": course, "generators": {},
        "summary": {"total":0,"correct":0,"wrong":0,
                    "format_issues":0,"errors":0,"needs_review":[]}
    }
    
    for gt, slist in by_gen.items():
        print(f"  Evaluating {gt} ({len(slist)} samples)... ", end="", flush=True)
        gd = {"evaluations":[],"issues":[],"needs_review":False,"accuracy":""}
        correct = total = 0
        
        for s in slist:
            if "error" in s:
                gd["issues"].append(f"Gen error d{s.get('difficulty','?')}: {s['error']}")
                report["summary"]["errors"] += 1
                continue
            ev = evaluate(s, course)
            time.sleep(0.25)
            gd["evaluations"].append(ev)
            total += 1
            report["summary"]["total"] += 1
            if "error" in ev:
                report["summary"]["errors"] += 1
                continue
            if ev.get("is_correct"):
                correct += 1
                report["summary"]["correct"] += 1
            else:
                report["summary"]["wrong"] += 1
                gd["issues"].append(
                    f"WRONG d{s.get('difficulty','?')}: "
                    f"Q='{s.get('question','')[:55]}' "
                    f"Gen='{s.get('answer','')[:25]}' "
                    f"Claude='{ev.get('my_answer','?')[:25]}'"
                )
            if not ev.get("format_ok"):
                report["summary"]["format_issues"] += 1
                gd["issues"].append(f"FORMAT: {ev.get('format_note','')}")
        
        if total > 0:
            wr = (total - correct) / total
            gd["accuracy"] = f"{correct}/{total}"
            gd["wrong_rate"] = round(wr, 3)
            gd["needs_review"] = wr > 0.05
            if gd["needs_review"]:
                report["summary"]["needs_review"].append(gt)
            print(f"{correct}/{total} {'✅' if not gd['needs_review'] else '❌ REVIEW'}")
        else:
            print("no valid samples")
        report["generators"][gt] = gd
    
    s = report["summary"]
    if s["total"] > 0:
        s["accuracy_pct"] = round(s["correct"]/s["total"]*100, 1)
    return report

def write_report(data: dict, path: str):
    s = data["summary"]
    lines = [
        f"# Generator Audit — {data['course']}",
        f"**Date:** {time.strftime('%Y-%m-%d %H:%M')}\n",
        "## Summary\n",
        "| Metric | Value |", "|---|---|",
        f"| Generators tested | {len(data['generators'])} |",
        f"| Total evaluations | {s['total']} |",
        f"| Overall accuracy | {s.get('accuracy_pct','N/A')}% |",
        f"| Wrong answers | {s['wrong']} |",
        f"| Format issues | {s['format_issues']} |",
        f"| Needs review | {len(s['needs_review'])} |\n",
    ]
    if s["needs_review"]:
        lines += ["## ❌ Generators Requiring Review\n"]
        for gt in s["needs_review"]:
            gd = data["generators"][gt]
            lines.append(f"### `{gt}` — {gd.get('accuracy','?')} correct")
            for issue in gd["issues"][:8]:
                lines.append(f"- {issue}")
            lines.append("")
    lines += ["## All Results\n",
              "| Generator | Accuracy | Wrong% | Status |",
              "|---|---|---|---|"]
    for gt, gd in data["generators"].items():
        wr = f"{int(gd.get('wrong_rate',0)*100)}%"
        status = "✅" if not gd["needs_review"] else "❌ Review"
        lines.append(f"| `{gt}` | {gd.get('accuracy','?')} | {wr} | {status} |")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text("\n".join(lines), encoding="utf-8")
    print(f"\nReport saved: {path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", required=True, choices=list(PREFIXES))
    parser.add_argument("--samples", type=int, default=5,
                        help="Samples per generator per difficulty (default 5)")
    parser.add_argument("--output", default=None)
    args = parser.parse_args()
    if not API_KEY:
        print("ERROR: set ANTHROPIC_API_KEY env var"); sys.exit(1)
    print(f"MathAthlone Generator Evaluator | Course={args.course} | Samples/diff={args.samples}")
    data = evaluate_course(args.course, args.samples)
    out = args.output or str(REPO/"docs"/"audits"/f"{args.course}_audit.md")
    write_report(data, out)
    s = data["summary"]
    print(f"\nDONE — Accuracy={s.get('accuracy_pct','N/A')}% | Wrong={s['wrong']} | Review={s['needs_review'] or 'none'}")
