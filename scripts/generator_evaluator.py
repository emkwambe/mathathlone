"""
MathAthlone Generator Quality Evaluator v4
==========================================
Enhancements over v3:
  1. Two-pass evaluation — first checks math equivalence, then format
  2. Distinguishes TRUE wrong answers from FORMAT disagreements
  3. Auto-fix mode — reads generator source and proposes TypeScript fix
  4. Confidence-weighted scoring — low-confidence flags don't block

Usage:
  python scripts/generator_evaluator.py --course MF --samples 20 --strict --llm deepseek
  python scripts/generator_evaluator.py --course MF --samples 10 --llm deepseek --fix
"""

import subprocess, json, time, argparse, os, sys, re
from pathlib import Path

REPO = Path(r"C:\Users\HP\Documents\mathathlone-app")
PREFIXES = {
    "G6":"g6_", "G7":"g7_", "G8":"g8_",
    "ALG1":"alg1_", "MF":"mf_", "NCM3":"m3_"
}
WRONG_RATE_THRESHOLD = 0.0
LOOSE_THRESHOLD      = 0.05

# ── LLM backends ──────────────────────────────────────────────────────────────

def call_deepseek(prompt: str, system: str, max_tokens: int = 600) -> str:
    import urllib.request
    api_key = os.environ.get("DEEPSEEK_API_KEY","")
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY not set")
    payload = json.dumps({
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": prompt}
        ],
        "max_tokens": max_tokens,
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

def call_anthropic(prompt: str, system: str, max_tokens: int = 600) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY",""))
    resp = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role":"user","content":prompt}]
    )
    return resp.content[0].text.strip()

def call_openai(prompt: str, system: str, max_tokens: int = 600) -> str:
    import urllib.request
    api_key = os.environ.get("OPENAI_API_KEY","")
    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": 0
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data["choices"][0]["message"]["content"].strip()

LLM_BACKENDS = {
    "deepseek":  call_deepseek,
    "anthropic": call_anthropic,
    "openai":    call_openai,
}

# ── Sampling ───────────────────────────────────────────────────────────────────

def sample_generators(prefix: str, spd: int) -> list:
    script = str(REPO / "scripts" / "sample-generators.ts")
    cmd = f"npx tsx {script} {prefix} {spd}"
    r = subprocess.run(cmd, cwd=str(REPO), capture_output=True,
                       encoding='utf-8', errors='replace',
                       timeout=180, shell=True)
    if r.returncode != 0:
        print(f"  Sampler error: {r.stderr[:200]}")
        return []
    try:
        return json.loads(r.stdout.strip())
    except Exception as e:
        print(f"  JSON parse error: {e}")
        return []

# ── Two-pass evaluation ────────────────────────────────────────────────────────

EVAL_SYSTEM = """You are a strict mathematics education quality auditor.
Solve problems independently. Respond ONLY with valid JSON. No markdown."""

EVAL_PROMPT = """Evaluate this math generator output carefully.

Question: {question}
Generator answer: {answer}
Answer type: {answer_type}
Difficulty (1-4): {difficulty}
Solution steps: {steps}

IMPORTANT RULES for is_correct:
- Mathematical equivalence counts as correct:
  * "7" and "7.0" are equivalent
  * "1/3" and "0.333..." are equivalent  
  * "-x + 3" and "3 - x" are equivalent
  * "20" for a percent question IS correct even without % symbol
  * Answers differing only by trailing zeros are equivalent
- Only mark is_correct=false if the MATHEMATICAL VALUE is genuinely wrong
- is_format_only_issue=true when answer is mathematically correct but 
  formatted differently than expected (missing %, extra decimals, etc.)

Return ONLY this JSON:
{{
  "my_answer": "<your computed answer>",
  "is_correct": <true or false>,
  "is_format_only_issue": <true if math is right but format differs>,
  "confidence": "<high|medium|low>",
  "format_ok": <true or false>,
  "format_note": "<issue or null>",
  "wording_ok": <true or false>,
  "wording_issue": "<grammatical or clarity problem or null>",
  "completeness_ok": <true or false>,
  "completeness_issue": "<missing info or null>",
  "difficulty_appropriate": <true or false>,
  "difficulty_issue": "<miscalibration or null>",
  "quality": "<good|minor_issue|major_issue>",
  "quality_note": "<issue or null>"
}}"""

def evaluate(sample: dict, llm: str) -> dict:
    backend = LLM_BACKENDS[llm]
    prompt = EVAL_PROMPT.format(
        question=sample.get('question',''),
        answer=sample.get('answer',''),
        answer_type=sample.get('answer_type',''),
        difficulty=sample.get('difficulty',''),
        steps=' | '.join(sample.get('solution_steps',[])[:3])
    )
    try:
        raw = backend(prompt, EVAL_SYSTEM)
        raw = raw.replace("```json","").replace("```","").strip()
        ev = json.loads(raw)
        ev["sample"] = sample
        ev["evaluator"] = llm
        return ev
    except Exception as e:
        err = str(e)
        if any(x in err.lower() for x in ["credit","billing","402","insufficient","payment"]):
            print(f"\n  ❌ {llm.upper()} API: credits depleted — {err[:80]}")
            sys.exit(1)
        return {"error": err, "sample": sample, "evaluator": llm}

# ── Auto-fix suggestion ────────────────────────────────────────────────────────

FIX_SYSTEM = """You are an expert TypeScript developer and mathematics educator.
You will be shown a generator function that has a bug, along with examples of 
wrong outputs. Propose a minimal surgical fix.
Respond ONLY with valid JSON. No markdown outside the JSON."""

FIX_PROMPT = """This TypeScript math generator has a confirmed bug.

Generator name: {gen_type}
Generator source code:
```typescript
{source_code}
```

Wrong answer examples:
{wrong_examples}

The mathematical error is:
{error_description}

Provide:
1. A brief diagnosis of the root cause in the code
2. The minimal TypeScript fix (specific lines to change)
3. The corrected code snippet

Return ONLY this JSON:
{{
  "diagnosis": "<root cause in 1-2 sentences>",
  "lines_to_change": ["<line description 1>", "<line description 2>"],
  "fixed_snippet": "<the corrected TypeScript code>",
  "confidence": "<high|medium|low>"
}}"""

def get_generator_source(gen_type: str) -> str:
    """Extract generator function source from generators.ts."""
    gen_file = REPO / "src" / "lib" / "competition" / "generators.ts"
    content = gen_file.read_text(encoding='utf-8', errors='replace')
    
    # Find the function
    func_name = f"generate_{gen_type}"
    start_idx = content.find(f"export function {func_name}")
    if start_idx == -1:
        return f"// Function {func_name} not found"
    
    # Find the end by counting braces
    brace_count = 0
    i = start_idx
    found_first = False
    while i < len(content):
        if content[i] == '{':
            brace_count += 1
            found_first = True
        elif content[i] == '}':
            brace_count -= 1
            if found_first and brace_count == 0:
                return content[start_idx:i+1]
        i += 1
    return content[start_idx:start_idx+2000]  # fallback

def suggest_fix(gen_type: str, wrong_samples: list, llm: str) -> dict:
    """Ask the LLM to diagnose and fix a broken generator."""
    source = get_generator_source(gen_type)
    
    wrong_examples = "\n".join([
        f"  Q: '{s.get('sample',{}).get('question','')[:80]}' "
        f"| Gen: '{s.get('sample',{}).get('answer','')}' "
        f"| Should be: '{s.get('my_answer','?')}'"
        for s in wrong_samples[:5]
    ])
    
    # Build error description from patterns
    error_desc = "Multiple wrong answers detected. "
    if all(s.get('confidence','') == 'high' for s in wrong_samples):
        error_desc += "High confidence these are genuine math errors."
    
    prompt = FIX_PROMPT.format(
        gen_type=gen_type,
        source_code=source[:3000],  # limit size
        wrong_examples=wrong_examples,
        error_description=error_desc
    )
    
    try:
        backend = LLM_BACKENDS[llm]
        raw = backend(prompt, FIX_SYSTEM, max_tokens=1500)
        raw = raw.replace("```json","").replace("```","").strip()
        return json.loads(raw)
    except Exception as e:
        return {"error": str(e), "diagnosis": "Could not generate fix suggestion"}

# ── Main evaluation loop ───────────────────────────────────────────────────────

def evaluate_course(course: str, spd: int, strict: bool, llm: str,
                    enable_fix: bool = False) -> dict:
    threshold = WRONG_RATE_THRESHOLD if strict else LOOSE_THRESHOLD
    prefix = PREFIXES[course]

    print(f"\nSampling {course} ({spd} samples/difficulty)...")
    samples = sample_generators(prefix, spd)

    by_gen: dict = {}
    for s in samples:
        gt = s.get("generator_type","?")
        by_gen.setdefault(gt, []).append(s)

    print(f"{course}: {len(by_gen)} generators | {len(samples)} samples | "
          f"Evaluator: {llm.upper()}\n")

    report = {
        "course": course, "strict": strict, "llm": llm,
        "generators": {},
        "summary": {
            "total":0, "correct":0, "wrong":0, "format_only":0,
            "wording_issues":0, "completeness_issues":0,
            "difficulty_issues":0, "errors":0,
            "pilot_ready":[], "blocked":[], "format_warnings":[]
        }
    }

    for gt, slist in by_gen.items():
        print(f"  {gt} ({len(slist)} samples)... ", end="", flush=True)
        gd = {
            "evaluations":[], "issues":[], "wording_issues":[],
            "difficulty_issues":[], "format_issues":[],
            "needs_review":False, "pilot_ready":False,
            "accuracy":"", "fix_suggestion":None
        }
        correct = total = format_only = 0
        wrong_samples = []

        for s in slist:
            if "error" in s:
                gd["issues"].append(f"Gen error d{s.get('difficulty','?')}: {s['error']}")
                report["summary"]["errors"] += 1
                continue

            ev = evaluate(s, llm)
            time.sleep(0.2)
            gd["evaluations"].append(ev)
            total += 1
            report["summary"]["total"] += 1

            if "error" in ev:
                report["summary"]["errors"] += 1
                gd["issues"].append(f"API error: {ev['error'][:60]}")
                continue

            math_correct = ev.get("is_correct", False)
            fmt_only = ev.get("is_format_only_issue", False)
            confidence = ev.get("confidence", "high")

            if math_correct:
                correct += 1
                report["summary"]["correct"] += 1
            elif fmt_only:
                # Mathematically correct but format differs — don't penalize
                correct += 1
                format_only += 1
                report["summary"]["correct"] += 1
                report["summary"]["format_only"] += 1
                gd["format_issues"].append(
                    f"FORMAT d{s.get('difficulty','?')}: "
                    f"Gen='{s.get('answer','')}' Expected='{ev.get('my_answer','?')}' "
                    f"({ev.get('format_note','')})"
                )
            elif confidence == "low":
                # Low confidence wrong — treat as correct, note it
                correct += 1
                report["summary"]["correct"] += 1
                gd["issues"].append(
                    f"LOW-CONF d{s.get('difficulty','?')}: "
                    f"Gen='{s.get('answer','')}' Evaluator='{ev.get('my_answer','?')}' "
                    f"(low confidence — treating as correct)"
                )
            else:
                report["summary"]["wrong"] += 1
                wrong_samples.append(ev)
                gd["issues"].append(
                    f"❌ WRONG d{s.get('difficulty','?')}: "
                    f"Q='{s.get('question','')[:65]}' "
                    f"| Gen='{s.get('answer','')}' "
                    f"| Should='{ev.get('my_answer','?')}' "
                    f"| Conf={confidence}"
                )

            if not ev.get("wording_ok", True):
                report["summary"]["wording_issues"] += 1
                gd["wording_issues"].append(
                    f"WORDING d{s.get('difficulty','?')}: "
                    f"{ev.get('wording_issue','')} "
                    f"| Q='{s.get('question','')[:65]}'"
                )

            if not ev.get("completeness_ok", True):
                report["summary"]["completeness_issues"] += 1
                gd["issues"].append(
                    f"INCOMPLETE d{s.get('difficulty','?')}: "
                    f"{ev.get('completeness_issue','')}"
                )

            if not ev.get("difficulty_appropriate", True):
                report["summary"]["difficulty_issues"] += 1
                gd["difficulty_issues"].append(
                    f"DIFFICULTY d{s.get('difficulty','?')}: "
                    f"{ev.get('difficulty_issue','')}"
                )

        if total > 0:
            actual_wrong = len(wrong_samples)
            wr = actual_wrong / total
            gd["accuracy"] = f"{correct}/{total}"
            gd["wrong_rate"] = round(wr, 4)
            gd["format_only_count"] = format_only
            gd["needs_review"] = wr > threshold
            gd["pilot_ready"] = (
                wr == 0.0 and
                not any("INCOMPLETE" in i for i in gd["issues"])
            )

            if gd["format_issues"]:
                report["summary"]["format_warnings"].append(gt)

            if gd["pilot_ready"]:
                report["summary"]["pilot_ready"].append(gt)
                status = "✅ PILOT READY"
                if format_only > 0:
                    status += f" (⚠ {format_only} format-only diffs)"
            elif gd["needs_review"]:
                report["summary"]["blocked"].append(gt)
                status = f"❌ {int(wr*100)}% WRONG — BLOCKED"
                
                # Auto-fix suggestion
                if enable_fix and wrong_samples:
                    print(f"\n    🔧 Generating fix suggestion for {gt}...")
                    fix = suggest_fix(gt, wrong_samples, llm)
                    gd["fix_suggestion"] = fix
                    if "diagnosis" in fix:
                        print(f"    Diagnosis: {fix['diagnosis'][:100]}")
            else:
                status = f"⚠️  {int(wr*100)}% wrong — monitor"

            print(f"{gd['accuracy']} — {status}")

            for issue in gd["issues"]:
                if "WRONG" in issue:
                    print(f"    {issue}")
            for issue in gd["wording_issues"][:2]:
                print(f"    {issue}")
        else:
            print("no valid samples")

        report["generators"][gt] = gd

    s = report["summary"]
    if s["total"] > 0:
        s["accuracy_pct"] = round(s["correct"]/s["total"]*100, 1)
    return report

# ── Report ─────────────────────────────────────────────────────────────────────

def write_report(data: dict, path: str):
    s = data["summary"]
    mode = "STRICT zero-tolerance" if data["strict"] else "Standard (<5%)"
    lines = [
        f"# Generator Quality Audit — {data['course']}",
        f"**Date:** {time.strftime('%Y-%m-%d %H:%M')} | "
        f"**Evaluator:** {data['llm'].upper()} | **Mode:** {mode}\n",
        "## Summary\n",
        "| Metric | Value |", "|---|---|",
        f"| Generators tested | {len(data['generators'])} |",
        f"| Total evaluations | {s['total']} |",
        f"| Overall accuracy | {s.get('accuracy_pct','N/A')}% |",
        f"| True wrong answers | {s['wrong']} |",
        f"| Format-only diffs | {s['format_only']} |",
        f"| Wording issues | {s['wording_issues']} |",
        f"| ✅ Pilot-ready | {len(s['pilot_ready'])} / {len(data['generators'])} |",
        f"| ❌ Blocked | {len(s['blocked'])} |\n",
    ]

    if s["pilot_ready"]:
        lines += [f"## ✅ Pilot-Ready Generators ({len(s['pilot_ready'])})\n"]
        for gt in s["pilot_ready"]:
            gd = data["generators"][gt]
            fmt_note = f" _(⚠ {gd['format_only_count']} format diffs)_" \
                       if gd.get("format_only_count",0) > 0 else ""
            lines.append(f"- `{gt}`{fmt_note}")
        lines.append("")

    if s["blocked"]:
        lines += [f"\n## ❌ Blocked — Fix Before Pilot ({len(s['blocked'])})\n"]
        for gt in s["blocked"]:
            gd = data["generators"][gt]
            wr = int(gd.get("wrong_rate",0)*100)
            lines.append(
                f"### `{gt}` — {gd.get('accuracy','?')} correct ({wr}% wrong)"
            )
            wrong = [i for i in gd["issues"] if "WRONG" in i]
            for issue in wrong[:6]:
                lines.append(f"- {issue}")
            
            if gd.get("fix_suggestion"):
                fix = gd["fix_suggestion"]
                lines += [
                    f"\n**🔧 Auto-fix suggestion:**",
                    f"- **Diagnosis:** {fix.get('diagnosis','N/A')}",
                    f"- **Lines to change:**"
                ]
                for l in fix.get("lines_to_change",[]):
                    lines.append(f"  - {l}")
                if fix.get("fixed_snippet"):
                    lines += [
                        f"- **Proposed fix:**",
                        f"```typescript",
                        fix["fixed_snippet"][:500],
                        f"```"
                    ]
            lines.append("")

    if s.get("format_warnings"):
        lines += ["\n## ⚠️ Format Differences (math correct, format varies)\n"]
        for gt in s["format_warnings"]:
            gd = data["generators"][gt]
            lines.append(f"### `{gt}`")
            for fi in gd.get("format_issues",[])[:3]:
                lines.append(f"- {fi}")
            lines.append("")

    wording_gens = [(gt, gd) for gt,gd in data["generators"].items()
                    if gd.get("wording_issues")]
    if wording_gens:
        lines += ["\n## ⚠️ Wording Issues\n"]
        for gt, gd in wording_gens:
            lines.append(f"### `{gt}`")
            for wi in gd["wording_issues"][:4]:
                lines.append(f"- {wi}")
            lines.append("")

    lines += ["\n## Full Results\n",
              "| Generator | Accuracy | Wrong% | Format Diffs | Pilot Ready |",
              "|---|---|---|---|---|"]
    for gt, gd in data["generators"].items():
        wr = f"{int(gd.get('wrong_rate',0)*100)}%"
        fmt = gd.get("format_only_count",0)
        ready = "✅" if gd.get("pilot_ready") else "❌"
        lines.append(
            f"| `{gt}` | {gd.get('accuracy','?')} | {wr} | {fmt} | {ready} |"
        )

    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text("\n".join(lines), encoding="utf-8")
    print(f"\nReport saved: {path}")

# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="MathAthlone Generator Evaluator v4 — LLM-agnostic + auto-fix"
    )
    parser.add_argument("--course", required=True, choices=list(PREFIXES))
    parser.add_argument("--samples", type=int, default=10)
    parser.add_argument("--strict", action="store_true",
                        help="Zero-tolerance: any true wrong answer blocks")
    parser.add_argument("--llm", default="deepseek",
                        choices=list(LLM_BACKENDS))
    parser.add_argument("--fix", action="store_true",
                        help="Generate fix suggestions for blocked generators")
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    key_map = {
        "deepseek":  "DEEPSEEK_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "openai":    "OPENAI_API_KEY"
    }
    if not os.environ.get(key_map[args.llm]):
        print(f"ERROR: set {key_map[args.llm]} environment variable")
        sys.exit(1)

    print(f"MathAthlone Generator Evaluator v4")
    print(f"Course={args.course} | Samples/diff={args.samples} | "
          f"LLM={args.llm.upper()} | Strict={args.strict} | Fix={args.fix}")
    print(f"Enhancement: format-only diffs no longer block pilot-ready status")

    data = evaluate_course(
        args.course, args.samples, args.strict, args.llm, args.fix
    )
    out = args.output or str(
        REPO/"docs"/"audits"/f"{args.course}_{args.llm}_v4_audit.md"
    )
    write_report(data, out)

    s = data["summary"]
    print(f"\n{'='*60}")
    print(f"AUDIT COMPLETE — {args.course} (v4, {args.llm.upper()})")
    print(f"  Accuracy:        {s.get('accuracy_pct','N/A')}%")
    print(f"  True wrong:      {s['wrong']}")
    print(f"  Format-only:     {s['format_only']} (not counted as wrong)")
    print(f"  Wording issues:  {s['wording_issues']}")
    print(f"  ✅ Pilot-ready:  {len(s['pilot_ready'])}/{len(data['generators'])}")
    print(f"  ❌ Blocked:      {len(s['blocked'])}")
    if s["blocked"]:
        print(f"\n  Fix before pilot:")
        for gt in s["blocked"]:
            gd = data["generators"][gt]
            print(f"    {gt}: {int(gd.get('wrong_rate',0)*100)}% wrong")
            if gd.get("fix_suggestion") and gd.get("fix_suggestion",{}).get("diagnosis"):
                print(f"      → {gd['fix_suggestion']['diagnosis'][:80]}")
