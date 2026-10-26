"""Host-Python logic tests. Storage, clock, web, prompts and votes are test doubles.
These DO NOT validate GenVM serialization, runner compilation or real consensus.
"""
import importlib.util
import json
from pathlib import Path
import sys
import types
import unittest
from datetime import datetime, timezone
from unittest.mock import Mock

gl = types.ModuleType("genlayer")
gl_types = types.ModuleType("genlayer.types")
gl_types.u32 = int
gl.Contract = object
gl.gl = gl
gl.TreeMap = dict
gl.u32 = int
gl.storage = types.SimpleNamespace(TreeMap=dict)
gl.public = types.SimpleNamespace(write=lambda f: f, view=lambda f: f)
gl.message = types.SimpleNamespace(sender_address="0x" + "a" * 40, raw={"datetime":"2026-10-26T00:00:00Z"})
gl.message_raw = {"datetime":"2026-10-26T00:00:00Z"}
gl.vm = types.SimpleNamespace(get_timestamp=lambda: datetime(2026, 10, 26, tzinfo=timezone.utc))
gl.vm.UserError = ValueError
gl.nondet = types.SimpleNamespace(web=types.SimpleNamespace(render=Mock()), exec_prompt=Mock())
gl.eq_principle = types.SimpleNamespace(prompt_comparative=lambda f, principle: f(), strict_eq=lambda f: f())
sys.modules["genlayer"] = gl
sys.modules["genlayer.types"] = gl_types
spec = importlib.util.spec_from_file_location("impact_contract", Path(__file__).parents[2] / "contracts/impact_proof.py")
contract_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(contract_module)

PROJECT = dict(name="Watershed restoration", description="Measurable impact", category="Reforestation",
               location="Vietnam", beneficiary="Local communities", website="https://example.org/project",
               objective="Increase survival", unit="surviving trees", baseline=0, target=100,
               deadline="2027-12-31", requirements="Independent report", methodology="Plot sampling")
MILESTONE = dict(outcome="Establish 50 surviving trees", target=50, deadline="2027-01-01",
                 method="Field survey", requirements="Independent audit", funding_reference="Grant A", allocation=100)
EVIDENCE = dict(urls=["https://example.org/report"], explanation="Audit documents survival counts")


class ContractLogicTests(unittest.TestCase):
    def setUp(self):
        gl.message.sender_address = "0x" + "a" * 40
        gl.nondet.web.render = Mock(return_value="Independent audit: 50 trees survived.")
        gl.nondet.exec_prompt = Mock(return_value=dict(decision="APPROVED", reason="Audit supports all criteria.", limitations="Physical outcomes not independently inspected."))
        gl.eq_principle.prompt_comparative = lambda f, principle: f()
        gl.eq_principle.strict_eq = lambda f: f()
        self.c = contract_module.ImpactProof()
        for name in ("projects", "milestones", "evidence", "verdicts"):
            setattr(self.c, name, {})

    def setup_milestone(self, evidence=False):
        self.c.create_project(json.dumps(PROJECT))
        self.c.add_milestone("1", json.dumps(MILESTONE))
        if evidence:
            self.c.submit_evidence("1:1", json.dumps(EVIDENCE))

    def test_valid_registration_and_finalized_views(self):
        self.assertEqual(self.c.create_project(json.dumps(PROJECT)), "1")
        self.assertEqual(json.loads(self.c.get_project("1"))["creator"], gl.message.sender_address)
        self.assertEqual(len(json.loads(self.c.list_projects(0, 50))), 1)
        self.assertEqual(self.c.interface_version(), "impactproof/1")

    def test_invalid_project_inputs(self):
        for change in ({"name": " "}, {"target": 0}, {"baseline": -1}, {"baseline": 100}, {"target": float("nan")}, {"category": "other"}, {"deadline": "2027-02-30"}):
            with self.subTest(change=change), self.assertRaises((ValueError, TypeError)):
                self.c.create_project(json.dumps(PROJECT | change))

    def test_valid_milestone_and_immutable_criteria(self):
        self.setup_milestone(True)
        m = json.loads(self.c.get_milestone("1:1"))
        self.assertEqual(m["target"], 50)
        self.assertEqual(m["status"], "READY_FOR_VERIFICATION")
        self.assertFalse(hasattr(self.c, "update_milestone"))

    def test_invalid_milestone_target_allocation_and_date(self):
        self.c.create_project(json.dumps(PROJECT))
        for change in ({"target": 0}, {"target": -1}, {"allocation": -1}, {"allocation": 1.5}, {"deadline": "2028-01-01"}, {"outcome": ""}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                self.c.add_milestone("1", json.dumps(MILESTONE | change))

    def test_unauthorized_milestone_and_evidence_and_verification(self):
        self.setup_milestone(True)
        gl.message.sender_address = "0x" + "b" * 40
        for operation in (lambda: self.c.add_milestone("1", json.dumps(MILESTONE)), lambda: self.c.submit_evidence("1:1", json.dumps(EVIDENCE)), lambda: self.c.verify_milestone("1:1")):
            with self.assertRaisesRegex(ValueError, "Creator only"):
                operation()

    def test_evidence_hash_and_duplicate_submission(self):
        self.setup_milestone(True)
        e = json.loads(self.c.get_evidence("1:1"))
        self.assertEqual(len(e["submission_sha256"]), 64)
        with self.assertRaises(ValueError):
            self.c.submit_evidence("1:1", json.dumps(EVIDENCE))

    def test_invalid_urls(self):
        for url in ("javascript:alert(1)", "http://example.org", "https://127.0.0.1/a", "https://localhost/a", "https://example.local/a", "https://a.org/a.pdf", "https://user:pass@a.org", "https://a.org:444/a"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                contract_module.public_url(url)

    def test_empty_and_duplicate_evidence(self):
        self.setup_milestone()
        for urls in ([], ["https://example.org/a"] * 2, ["https://example.org/a"] * 4):
            with self.assertRaises(ValueError):
                self.c.submit_evidence("1:1", json.dumps(EVIDENCE | {"urls": urls}))

    def test_unavailable_evidence_needs_review(self):
        self.setup_milestone(True)
        gl.nondet.web.render.side_effect = RuntimeError("Unavailable")
        self.c.verify_milestone("1:1")
        v = json.loads(self.c.get_verdict("1:1"))
        self.assertEqual(v["decision"], "NEEDS_REVIEW")
        self.assertFalse(v["funding_eligible"])
        self.assertFalse(v["sources"][0]["available"])
        gl.nondet.exec_prompt.assert_not_called()

    def test_approved_rejected_needs_review(self):
        for decision in ("APPROVED", "REJECTED", "NEEDS_REVIEW"):
            self.setUp()
            self.setup_milestone(True)
            gl.nondet.exec_prompt.return_value["decision"] = decision
            self.c.verify_milestone("1:1")
            v = json.loads(self.c.get_verdict("1:1"))
            self.assertEqual(v["decision"], decision)
            self.assertEqual(v["funding_eligible"], decision == "APPROVED")

    def test_conflicting_and_insufficient_evidence_prompt(self):
        for evidence in ("Two audits report contradictory counts", "Self-reported planting without survival measurement"):
            self.setUp()
            self.setup_milestone(True)
            gl.nondet.web.render.return_value = evidence
            gl.nondet.exec_prompt.return_value = dict(decision="NEEDS_REVIEW", reason="Insufficient corroboration", limitations="Claims unproven")
            self.c.verify_milestone("1:1")
            self.assertEqual(json.loads(self.c.get_verdict("1:1"))["decision"], "NEEDS_REVIEW")
            self.assertIn("UNTRUSTED", gl.nondet.exec_prompt.call_args.args[0])
            self.assertIn("contradictions", gl.nondet.exec_prompt.call_args.args[0])

    def test_opposing_decision_cannot_finalize(self):
        self.setup_milestone(True)
        gl.eq_principle.strict_eq = lambda f: "REJECTED"
        with self.assertRaisesRegex(ValueError, "disagreement"):
            self.c.verify_milestone("1:1")
        self.assertEqual(self.c.verdicts, {})

    def test_duplicate_finalization(self):
        self.setup_milestone(True)
        self.c.verify_milestone("1:1")
        before = self.c.get_verdict("1:1")
        with self.assertRaises(ValueError):
            self.c.verify_milestone("1:1")
        self.assertEqual(before, self.c.get_verdict("1:1"))

    def test_verification_requires_evidence(self):
        self.setup_milestone()
        with self.assertRaisesRegex(ValueError, "Evidence required"):
            self.c.verify_milestone("1:1")

    def test_storage_and_prompt_limits(self):
        with self.assertRaises(ValueError):
            self.c.create_project(" " * 12001)
        self.c.project_count = 1000
        with self.assertRaises(ValueError):
            self.c.create_project(json.dumps(PROJECT))

    def test_invalid_llm_output_never_commits(self):
        self.setup_milestone(True)
        gl.nondet.exec_prompt.return_value = {"decision": "APPROVED", "reason": "", "limitations": "none"}
        with self.assertRaises(ValueError):
            self.c.verify_milestone("1:1")
        self.assertEqual(self.c.verdicts, {})


if __name__ == "__main__":
    unittest.main()
