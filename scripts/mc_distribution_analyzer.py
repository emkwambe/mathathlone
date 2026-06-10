"""
MathAthlone MC Answer Distribution Analyzer
============================================
Analyzes whether correct answers are evenly distributed across
A, B, C, D positions in multiple choice questions.

For generators that produce MC questions natively (static questions),
AND for the proposed distractor builder in assessmentAssembler.ts.

Usage:
  python scripts/mc_distribution_analyzer.py --course G7 --samples 100
  python scripts/mc_distribution_analyzer.py --course ALL --samples 200
"""

import subprocess, json, argparse, os, sys, random
from pathlib import Path
from collections import Counter

REPO = Path(r"C:\Users\HP\Documents\mathathlone-app")
PREFIXES = {
    "G6":"g6_", "G7":"g7_", "G8":"g8_",
    "ALG1":"alg1_", "MF":"mf_", "NCM3":"m3_"
}

# ── Simulate the MC distractor builder ────────────────────────────────────────

def fisher_yates(arr):
    a = arr[:]
    for i in range(len(a)-1, 0, -1):
        j = random.randint(0, i)
        a[i], a[j] = a[j], a[i]
    return a

def build_mc_options_numeric(correct_answer: str) -> list:
    """Simulate the numeric distractor builder from assembler.ts"""
    try:
        correct = float(correct_answer)
    except:
        return None
    
    distractors = [
        round(correct * 1.1, 2),
        round(correct * 0.9, 2),
        round(correct + correct * 0.25, 2),
    ]
    # Deduplicate
    unique = list(set([str(d) for d in distractors if str(d) != correct_answer]))[:3]
    
    # Pad if needed
    while len(unique) < 3:
        unique.append(str(round(correct + random.uniform(-correct*0.5, correct*0.5), 2)))
    
    all_opts = [correct_answer] + unique[:3]
    shuffled = fisher_yates(all_opts)
    return shuffled

def build_mc_options_generator(gen_type: str, correct_answer: str,
                                 difficulty: int, all_samples: list) -> list:
    """Use other generator outputs as distractors (expression/text answers)"""
    # Get answers from other samples of same generator
    other_answers = [
        s.get('answer','') for s in all_samples
        if s.get('generator_type') == gen_type
        and s.get('answer','') != correct_answer
    ]
    unique_others = list(set(other_answers))[:3]
    
    while len(unique_others) < 3:
        unique_others.append(f"Option{len(unique_others)+1}")
    
    all_opts = [correct_answer] + unique_others[:3]
    shuffled = fisher_yates(all_opts)
    return shuffled

def get_correct_position(options: list, correct: str) -> str:
    """Returns A, B, C, or D based on correct answer position"""
    labels = ['A', 'B', 'C', 'D']
    for i, opt in enumerate(options):
        if str(opt) == str(correct):
            return labels[i]
    return '?'

# ── Sample generators ─────────────────────────────────────────────────────────

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
    except:
        return []

# ── Analysis ──────────────────────────────────────────────────────────────────

def analyze_distribution(samples: list, course: str) -> dict:
    """Analyze correct answer position distribution across all generators."""
    
    results = {
        "course": course,
        "total_analyzed": 0,
        "numeric_answers": 0,
        "expression_answers": 0,
        "overall_distribution": Counter(),
        "by_generator": {},
        "chi_square_p": None,
        "verdict": "",
        "bias_detected": False,
    }
    
    by_gen = {}
    for s in samples:
        gt = s.get("generator_type","?")
        by_gen.setdefault(gt, []).append(s)
    
    all_positions = []
    
    for gt, slist in by_gen.items():
        gen_positions = []
        numeric_count = 0
        expr_count = 0
        
        for s in slist:
            correct = s.get('answer','')
            answer_type = s.get('answer_type','')
            
            # Determine if numeric or expression
            is_numeric = answer_type in [
                'integer','decimal','fraction',
                'decimal_or_fraction','percent'
            ]
            
            if is_numeric:
                options = build_mc_options_numeric(correct)
                numeric_count += 1
                results["numeric_answers"] += 1
            else:
                options = build_mc_options_generator(gt, correct, 
                    s.get('difficulty',2), slist)
                expr_count += 1
                results["expression_answers"] += 1
            
            if options:
                pos = get_correct_position(options, correct)
                gen_positions.append(pos)
                all_positions.append(pos)
                results["total_analyzed"] += 1
        
        if gen_positions:
            dist = Counter(gen_positions)
            total = len(gen_positions)
            
            # Check for bias — any letter > 40% is suspicious
            max_pct = max(dist.values()) / total * 100
            bias = max_pct > 40
            
            results["by_generator"][gt] = {
                "total": total,
                "distribution": dict(dist),
                "percentages": {
                    k: round(v/total*100,1) for k,v in dist.items()
                },
                "max_pct": round(max_pct,1),
                "bias_detected": bias,
                "numeric": numeric_count,
                "expression": expr_count,
            }
    
    # Overall distribution
    results["overall_distribution"] = dict(Counter(all_positions))
    total = results["total_analyzed"]
    
    if total > 0:
        results["overall_percentages"] = {
            k: round(v/total*100,1) 
            for k,v in results["overall_distribution"].items()
        }
        
        # Expected: 25% each for A, B, C, D
        expected = total / 4
        observed = [results["overall_distribution"].get(l,0) 
                   for l in ['A','B','C','D']]
        
        # Chi-square test
        chi_sq = sum((o - expected)**2 / expected for o in observed)
        # df=3, critical value at p=0.05 is 7.815
        p_value_ok = chi_sq < 7.815
        
        results["chi_square"] = round(chi_sq, 3)
        results["chi_square_p_ok"] = p_value_ok
        results["expected_per_letter"] = round(expected, 1)
        
        max_overall = max(results["overall_distribution"].values()) / total * 100
        results["bias_detected"] = max_overall > 35 or not p_value_ok
        
        if results["bias_detected"]:
            results["verdict"] = (
                f"⚠️  BIAS DETECTED — Chi-square={chi_sq:.2f} "
                f"({'FAIL' if not p_value_ok else 'PASS'} at p=0.05). "
                f"Distribution is not uniform. Fix the shuffle logic."
            )
        else:
            results["verdict"] = (
                f"✅ DISTRIBUTION OK — Chi-square={chi_sq:.2f} "
                f"(PASS at p=0.05). Answers are evenly distributed."
            )
    
    return results

# ── Report ─────────────────────────────────────────────────────────────────────

def print_report(results: dict):
    course = results["course"]
    total = results["total_analyzed"]
    
    print(f"\n{'='*60}")
    print(f"MC ANSWER DISTRIBUTION REPORT — {course}")
    print(f"{'='*60}")
    print(f"Total questions analyzed: {total}")
    print(f"  Numeric answers:    {results['numeric_answers']}")
    print(f"  Expression answers: {results['expression_answers']}")
    print()
    
    # Overall bar chart
    print("OVERALL CORRECT ANSWER POSITION:")
    print(f"  Expected per letter: ~{results.get('expected_per_letter',0)} ({100/4:.1f}%)")
    print()
    
    for letter in ['A','B','C','D']:
        count = results["overall_distribution"].get(letter, 0)
        pct = results.get("overall_percentages",{}).get(letter, 0)
        bar = "█" * int(pct / 2)
        flag = " ⚠️ BIASED" if pct > 35 else ""
        print(f"  {letter}: {bar:<25} {count:3d} ({pct:5.1f}%){flag}")
    
    print()
    print(f"Chi-square statistic: {results.get('chi_square','N/A')}")
    print(f"  (Critical value at p=0.05, df=3: 7.815)")
    print(f"  {'✅ PASS — distribution is uniform' if results.get('chi_square_p_ok') else '❌ FAIL — distribution is biased'}")
    print()
    print(f"VERDICT: {results['verdict']}")
    
    # Per-generator breakdown
    print(f"\n{'─'*60}")
    print("PER-GENERATOR BREAKDOWN:")
    print(f"{'Generator':<40} {'A':>5} {'B':>5} {'C':>5} {'D':>5} {'Max%':>6} {'Status':>10}")
    print(f"{'─'*40} {'─'*5} {'─'*5} {'─'*5} {'─'*5} {'─'*6} {'─'*10}")
    
    for gt, gd in results["by_generator"].items():
        pcts = gd.get("percentages",{})
        a = pcts.get('A',0)
        b = pcts.get('B',0)
        c = pcts.get('C',0)
        d = pcts.get('D',0)
        max_p = gd.get("max_pct",0)
        status = "⚠️ BIASED" if gd.get("bias_detected") else "✅ OK"
        print(f"  {gt:<38} {a:>5.1f} {b:>5.1f} {c:>5.1f} {d:>5.1f} {max_p:>6.1f} {status:>10}")

def write_report(results: dict, path: str):
    total = results["total_analyzed"]
    lines = [
        f"# MC Answer Distribution Report — {results['course']}",
        f"**Samples:** {total} | **Method:** Fisher-Yates shuffle simulation\n",
        "## Overall Distribution\n",
        "| Letter | Count | % | Expected % | Status |",
        "|---|---|---|---|---|",
    ]
    for letter in ['A','B','C','D']:
        count = results["overall_distribution"].get(letter, 0)
        pct = results.get("overall_percentages",{}).get(letter, 0)
        status = "⚠️ Biased" if pct > 35 else "✅ OK"
        lines.append(f"| {letter} | {count} | {pct}% | 25.0% | {status} |")
    
    lines += [
        f"\n**Chi-square:** {results.get('chi_square','N/A')} "
        f"(critical=7.815 at p=0.05)\n",
        f"**Verdict:** {results['verdict']}\n",
        "## Per-Generator Results\n",
        "| Generator | A% | B% | C% | D% | Max% | Status |",
        "|---|---|---|---|---|---|---|",
    ]
    for gt, gd in results["by_generator"].items():
        pcts = gd.get("percentages",{})
        a,b,c,d = pcts.get('A',0),pcts.get('B',0),pcts.get('C',0),pcts.get('D',0)
        status = "⚠️ Biased" if gd.get("bias_detected") else "✅ OK"
        lines.append(f"| `{gt}` | {a} | {b} | {c} | {d} | {gd.get('max_pct',0)} | {status} |")
    
    lines += [
        "\n## What This Measures\n",
        "- **Fisher-Yates shuffle** is used to place the correct answer randomly among 4 options",
        "- A perfectly uniform distribution gives 25% for each of A, B, C, D",
        "- Chi-square test checks if observed distribution is statistically different from uniform",
        "- If bias detected: students can guess the position rather than solving the problem",
        "- Threshold: any letter > 35% is flagged; chi-square > 7.815 at p=0.05 fails",
    ]
    
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text("\n".join(lines), encoding="utf-8")
    print(f"\nReport saved: {path}")

# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Analyze MC answer position distribution"
    )
    parser.add_argument("--course", required=True,
                        choices=list(PREFIXES) + ["ALL"])
    parser.add_argument("--samples", type=int, default=100,
                        help="Samples per generator per difficulty (default 100)")
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    courses = list(PREFIXES.keys()) if args.course == "ALL" else [args.course]
    
    all_results = []
    for course in courses:
        prefix = PREFIXES[course]
        print(f"\nSampling {course} generators...")
        samples = sample_generators(prefix, args.samples)
        if not samples:
            print(f"  No samples for {course}")
            continue
        print(f"  Got {len(samples)} samples from "
              f"{len(set(s.get('generator_type') for s in samples))} generators")
        
        results = analyze_distribution(samples, course)
        print_report(results)
        all_results.append(results)
        
        out = args.output or str(
            REPO / "docs" / "audits" / f"{course}_mc_distribution.md"
        )
        write_report(results, out)
    
    # Summary across all courses
    if len(all_results) > 1:
        print(f"\n{'='*60}")
        print("CROSS-COURSE SUMMARY")
        print(f"{'='*60}")
        for r in all_results:
            bias = "⚠️ BIASED" if r["bias_detected"] else "✅ OK"
            print(f"  {r['course']:<8} Chi-sq={r.get('chi_square','?'):>6} {bias}")
