import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("evaluate_g6_ratios_static_math_rules.py")
FIXTURE = Path(__file__).parents[1] / "docs/PILOT_CONTENT_AUDIT_EVIDENCE/g6-ratios-static-draft-fixture.json"
TEMPLATE = Path(__file__).parents[1] / "config/g6_ratios_static_math_rule_pack.template.json"


class EvaluatorRegressionTests(unittest.TestCase):
    def run_evaluator(self, items, pack, source_kind="fixture"):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            items_path = root / "items.json"
            pack_path = root / "pack.json"
            output_json = root / "evidence.json"
            output_md = root / "evidence.md"
            items_path.write_text(json.dumps(items), encoding="utf-8")
            pack_path.write_text(json.dumps(pack), encoding="utf-8")
            completed = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--items",
                    str(items_path),
                    "--rule-pack",
                    str(pack_path),
                    "--source-kind",
                    source_kind,
                    "--output-json",
                    str(output_json),
                    "--output-md",
                    str(output_md),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            return completed, json.loads(output_json.read_text(encoding="utf-8"))

    def test_fixture_is_explicitly_ineligible_and_returns_nonzero(self):
        items = json.loads(FIXTURE.read_text(encoding="utf-8"))
        pack = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        completed, evidence = self.run_evaluator(items, pack)
        self.assertNotEqual(completed.returncode, 0)
        self.assertEqual(evidence["source_kind"], "fixture")
        self.assertEqual(evidence["pass_count"], 0)
        self.assertEqual(evidence["hold_count"], 5)
        self.assertIn("SOURCE_NOT_MARKED_LIVE", {issue["code"] for issue in evidence["results"][0]["issues"]})
        self.assertIn("items_sha256", evidence["source_provenance"])
        self.assertIn("rule_pack_sha256", evidence["source_provenance"])

    def test_malformed_options_hold_without_traceback(self):
        items = json.loads(FIXTURE.read_text(encoding="utf-8"))
        pack = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        items[0]["options"] = None
        completed, evidence = self.run_evaluator(items, pack, source_kind="live_export")
        self.assertNotEqual(completed.returncode, 0)
        codes = {issue["code"] for issue in evidence["results"][0]["issues"]}
        self.assertIn("OPTIONS_MALFORMED", codes)
        self.assertNotIn("Traceback", completed.stderr)

    def test_duplicate_ids_and_rule_count_are_holds(self):
        items = json.loads(FIXTURE.read_text(encoding="utf-8"))
        pack = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        pack["rules"] = pack["rules"][:1] + [copy.deepcopy(pack["rules"][0])]
        completed, evidence = self.run_evaluator(items + [items[0]], pack, source_kind="live_export")
        self.assertNotEqual(completed.returncode, 0)
        global_codes = {issue["code"] for issue in evidence["global_issues"]}
        self.assertIn("RULE_COUNT_MISMATCH", global_codes)
        self.assertIn("DUPLICATE_STATIC_ITEM_IDS", global_codes)

    def test_invalid_pack_approval_date_is_hold(self):
        items = json.loads(FIXTURE.read_text(encoding="utf-8"))
        pack = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        pack["approval"] = {"approved_by": "reviewer", "approved_at": "not-a-date", "approval_reference": "ref"}
        completed, evidence = self.run_evaluator(items, pack, source_kind="live_export")
        self.assertNotEqual(completed.returncode, 0)
        codes = {issue["code"] for issue in evidence["results"][0]["issues"]}
        self.assertIn("RULE_PACK_APPROVAL_DATE_INVALID", codes)


if __name__ == "__main__":
    unittest.main()
