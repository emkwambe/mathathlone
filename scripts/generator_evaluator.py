"""
MathAthlone Generator Quality Evaluator
========================================
Uses Claude API to independently verify generator outputs.

Usage:
  python generator_evaluator.py --course G7 --samples 20 --output report.json

Requirements:
  pip install anthropic subprocess json pathlib

Pipeline:
  1. Calls each generator via Node.js wrapper
  2. Sends (question, answer, answer_type) to Claude for verification
  3. Produces structured audit report
"""

import subprocess
import json
import time
import argparse
import os
from pathlib import Path
from typing import Any

# ── Configuration ──────────────────────────────────────────────────────────────

REPO_PATH = r"C:\Users\HP\Documents\mathathlone-app"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Generator prefixes per course
COURSE_PREFIXES = {
    "G6":   "g6_",
    "G7":   "g7_",
    "G8":   "g8_",
    "ALG1": "alg1_",
    "MF":   "mf_",
    "NCM3": "m3_",
    "NCM1": "",  # legacy — no prefix
}

# ── Node.js wrapper script (written to disk temporarily) ──────────────────────

NODE_RUNNER = """
// generator-runner.js
// Calls a single generator N times at each difficulty and returns JSON

const path = require('path');

// We need ts-node or the compiled output
// This assumes generators.ts has been compiled or we use tsx
async function main() {
  const args = JSON.parse(process.argv[2]);
  const { generatorType, samples, difficulties } = args;
  
  // Dynamic import of generators
  // Adjust path if using compiled JS
  const { GENERATORS } = require('./src/lib/competition/generators');
  
  const fn = GENERATORS[generatorType];
  if (!fn) {
    console.log(JSON.stringify({ error: `Generator not found: ${generatorType}` }));
    process.exit(1);
  }
  
  const results = [];
  for (const difficulty of difficulties) {
    for (let i = 0; i < samples; i++) {
      try {
        const q = fn(difficulty);
        results.push({
          generator_type: generatorType,
          difficulty,
          question: q.question,
          answer: String(q.answer),
          answer_type: q.answer_type,
          concept_name: q.concept_name,
          solution_steps: q.solution_steps || [],
        });
      } catch (e) {
        results.push({
          generator_type: generatorType,
          difficulty,
          error: e.message,
        });
      }
    }
  }
  console.log(JSON.stringify(results));
}

main().catch(e => {
  console.log(JSON.stringify({ error: e.message }));
  process.exit(1);
});
"""

# ── Claude evaluation prompt ───────────────────────────────────────────────────

EVALUATOR_SYSTEM = """You are a mathematics education quality auditor.
You will be given a math question, the generator's answer, and the declared answer_type.
Your job is to:
1. Independently solve the question using correct mathematics
2. Verify whether the generator's answer is correct
3. Check if the answer format matches the answer_type
4. Assess the difficulty level appropriateness
5. Flag any issues with the question text itself

Respond ONLY with valid JSON. No explanation outside the JSON.
"""

EVALUATOR_PROMPT = """Evaluate this generator output:

Question: {question}
Generator's Answer: {answer}
Answer Type: {answer_type}
Declared Difficulty: {difficulty}
Course: {course}
Concept: {concept_name}
Solution Steps: {solution_steps}

Respond with this exact JSON structure:
{{
  "my_answer": "your independent computed answer",
  "is_correct": true/false,
  "correctness_confidence": "high/medium/low",
  "format_matches_type": true/false,
  "format_issue": "description or null",
  "difficulty_appropriate": true/false,
  "difficulty_issue": "description or null",
  "question_quality": "good/minor_issue/major_issue",
  "question_issue": "description or null",
  "grade_appropriate": true/false,
  "notes": "any additional observations or null"
}}
"""

# ── Core evaluation functions ──────────────────────────────────────────────────

def call_generator(generator_type: str, samples: int, difficulties: list) -> list:
    """Call a TypeScript generator via Node.js and return samples."""
    
    # Write the runner script
    runner_path = Path(REPO_PATH) / "scripts" / "generator-runner.js"
    runner_path.parent.mkdir(exist_ok=True)
    runner_path.write_text(NODE_RUNNER)
    
    args = json.dumps({
        "generatorType": generator_type,
        "samples": samples,
        "difficulties": difficulties
    })
    
    try:
        result = subprocess.run(
            ["node", str(runner_path), args],
            cwd=REPO_PATH,
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode != 0:
            return [{"error": result.stderr}]
        return json.loads(result.stdout)
    except Exception as e:
        return [{"error": str(e)}]


def evaluate_with_claude(sample: dict, course: str) -> dict:
    """Send a generator sample to Claude for mathematical verification."""
    import anthropic
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    
    prompt = EVALUATOR_PROMPT.format(
        question=sample.get("question", ""),
        answer=sample.get("answer", ""),
        answer_type=sample.get("answer_type", ""),
        difficulty=sample.get("difficulty", ""),
        course=course,
        concept_name=sample.get("concept_name", ""),
        solution_steps="\n".join(sample.get("solution_steps", []))
    )
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=EVALUATOR_SYSTEM,
            messages=[{"role": "user", "content": prompt}]
        )
        
        raw = response.content[0].text.strip()
        # Strip markdown if present
        raw = raw.replace("```json", "").replace("```", "").strip()
        evaluation = json.loads(raw)
        evaluation["sample"] = sample
        return evaluation
        
    except Exception as e:
        return {
            "error": str(e),
            "sample": sample
        }


def evaluate_course(course: str, samples_per_difficulty: int = 10) -> dict:
    """Evaluate all generators for a course."""
    
    prefix = COURSE_PREFIXES.get(course, "")
    difficulties = [1, 2, 3, 4]
    results = {
        "course": course,
        "generators": {},
        "summary": {
            "total_samples": 0,
            "correct": 0,
            "wrong": 0,
            "format_issues": 0,
            "difficulty_issues": 0,
            "question_issues": 0,
            "errors": 0,
            "generators_with_errors": [],
            "generators_needing_review": []
        }
    }
    
    # Get all generator types for this course from the GENERATORS map
    # This requires calling Node.js to list them
    list_script = f"""
const {{ GENERATORS }} = require('./src/lib/competition/generators');
const prefix = '{prefix}';
const types = Object.keys(GENERATORS).filter(k => k.startsWith(prefix));
console.log(JSON.stringify(types));
"""
    list_path = Path(REPO_PATH) / "scripts" / "list-generators.js"
    list_path.write_text(list_script)
    
    try:
        result = subprocess.run(
            ["node", str(list_path)],
            cwd=REPO_PATH,
            capture_output=True,
            text=True,
            timeout=10
        )
        generator_types = json.loads(result.stdout)
    except:
        generator_types = []
    
    print(f"\n{course}: Found {len(generator_types)} generators")
    
    for gen_type in generator_types:
        print(f"  Testing {gen_type}...", end=" ")
        
        # Generate samples
        samples = call_generator(gen_type, samples_per_difficulty, difficulties)
        gen_results = {
            "samples": [],
            "error_rate": 0,
            "wrong_answer_rate": 0,
            "format_issue_rate": 0,
            "needs_review": False,
            "issues": []
        }
        
        correct_count = 0
        total_count = 0
        
        for sample in samples:
            if "error" in sample:
                gen_results["issues"].append(f"Generation error: {sample['error']}")
                results["summary"]["errors"] += 1
                continue
            
            # Evaluate with Claude
            evaluation = evaluate_with_claude(sample, course)
            time.sleep(0.5)  # Rate limiting
            
            gen_results["samples"].append(evaluation)
            total_count += 1
            results["summary"]["total_samples"] += 1
            
            if "error" in evaluation:
                results["summary"]["errors"] += 1
                continue
            
            if evaluation.get("is_correct"):
                correct_count += 1
                results["summary"]["correct"] += 1
            else:
                results["summary"]["wrong"] += 1
                gen_results["issues"].append(
                    f"Wrong answer at difficulty {sample['difficulty']}: "
                    f"Q='{sample['question']}' "
                    f"Generator='{sample['answer']}' "
                    f"Claude='{evaluation.get('my_answer')}'"
                )
            
            if not evaluation.get("format_matches_type"):
                results["summary"]["format_issues"] += 1
                gen_results["issues"].append(
                    f"Format mismatch: {evaluation.get('format_issue')}"
                )
            
            if not evaluation.get("difficulty_appropriate"):
                results["summary"]["difficulty_issues"] += 1
            
            if evaluation.get("question_quality") != "good":
                results["summary"]["question_issues"] += 1
        
        if total_count > 0:
            wrong_rate = (total_count - correct_count) / total_count
            gen_results["wrong_answer_rate"] = round(wrong_rate, 3)
            gen_results["needs_review"] = wrong_rate > 0.05  # >5% wrong triggers review
            
            if gen_results["needs_review"]:
                results["summary"]["generators_needing_review"].append(gen_type)
        
        results["generators"][gen_type] = gen_results
        status = "✅" if not gen_results["needs_review"] else "❌ REVIEW"
        print(f"{status} ({correct_count}/{total_count} correct)")
    
    # Final summary
    total = results["summary"]["total_samples"]
    if total > 0:
        results["summary"]["accuracy_pct"] = round(
            results["summary"]["correct"] / total * 100, 1
        )
    
    return results


def generate_report(results: dict, output_path: str):
    """Generate a markdown audit report from evaluation results."""
    
    lines = [
        f"# Generator Quality Audit Report — {results['course']}",
        f"**Generated:** {time.strftime('%Y-%m-%d %H:%M')}",
        "",
        "## Summary",
        "",
        f"| Metric | Value |",
        f"|---|---|",
        f"| Total samples evaluated | {results['summary']['total_samples']} |",
        f"| Overall accuracy | {results['summary'].get('accuracy_pct', 0)}% |",
        f"| Wrong answers found | {results['summary']['wrong']} |",
        f"| Format issues | {results['summary']['format_issues']} |",
        f"| Generators needing review | {len(results['summary']['generators_needing_review'])} |",
        "",
    ]
    
    if results['summary']['generators_needing_review']:
        lines += [
            "## ❌ Generators Requiring Immediate Review",
            "",
        ]
        for gen in results['summary']['generators_needing_review']:
            gen_data = results['generators'].get(gen, {})
            lines.append(f"### {gen} ({gen_data.get('wrong_answer_rate', 0)*100:.1f}% wrong)")
            for issue in gen_data.get("issues", [])[:5]:
                lines.append(f"- {issue}")
            lines.append("")
    
    lines += [
        "## All Generator Results",
        "",
        "| Generator | Samples | Accuracy | Format OK | Status |",
        "|---|---|---|---|---|",
    ]
    
    for gen_type, gen_data in results['generators'].items():
        total = len(gen_data.get("samples", []))
        correct = sum(1 for s in gen_data.get("samples", []) 
                     if s.get("is_correct"))
        acc = f"{correct}/{total}" if total > 0 else "0/0"
        fmt_ok = sum(1 for s in gen_data.get("samples", [])
                    if s.get("format_matches_type"))
        fmt = f"{fmt_ok}/{total}"
        status = "✅" if not gen_data.get("needs_review") else "❌ Review"
        lines.append(f"| {gen_type} | {total} | {acc} | {fmt} | {status} |")
    
    lines += [
        "",
        "## Sample Wrong Answers (for debugging)",
        "",
    ]
    
    for gen_type, gen_data in results['generators'].items():
        wrong = [s for s in gen_data.get("samples", [])
                if not s.get("is_correct") and "sample" in s]
        if wrong:
            lines.append(f"### {gen_type}")
            for w in wrong[:3]:
                sample = w.get("sample", {})
                lines += [
                    f"- **Q:** {sample.get('question', '')}",
                    f"  **Generator:** `{sample.get('answer', '')}`",
                    f"  **Claude:** `{w.get('my_answer', '')}`",
                    f"  **Difficulty:** {sample.get('difficulty', '')}",
                    "",
                ]
    
    content = "\n".join(lines)
    Path(output_path).write_text(content, encoding="utf-8")
    print(f"\nReport written to: {output_path}")


# ── CLI entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MathAthlone Generator Evaluator")
    parser.add_argument("--course", required=True, 
                       choices=list(COURSE_PREFIXES.keys()),
                       help="Course to evaluate")
    parser.add_argument("--samples", type=int, default=10,
                       help="Samples per generator per difficulty (default: 10)")
    parser.add_argument("--output", default="generator_audit_report.md",
                       help="Output report path")
    parser.add_argument("--json-output", default=None,
                       help="Also save raw JSON results")
    args = parser.parse_args()
    
    print(f"MathAthlone Generator Evaluator")
    print(f"Course: {args.course} | Samples per difficulty: {args.samples}")
    print(f"API Key: {'✅ Set' if ANTHROPIC_API_KEY else '❌ NOT SET — export ANTHROPIC_API_KEY'}")
    
    if not ANTHROPIC_API_KEY:
        print("ERROR: Set ANTHROPIC_API_KEY environment variable first")
        exit(1)
    
    results = evaluate_course(args.course, args.samples)
    
    if args.json_output:
        Path(args.json_output).write_text(
            json.dumps(results, indent=2), encoding="utf-8"
        )
    
    generate_report(results, args.output)
    
    # Print quick summary
    print(f"\n{'='*50}")
    print(f"AUDIT COMPLETE — {args.course}")
    print(f"  Accuracy: {results['summary'].get('accuracy_pct', 0)}%")
    print(f"  Wrong answers: {results['summary']['wrong']}")
    print(f"  Generators needing review: "
          f"{len(results['summary']['generators_needing_review'])}")
    if results['summary']['generators_needing_review']:
        for g in results['summary']['generators_needing_review']:
            print(f"    ❌ {g}")

