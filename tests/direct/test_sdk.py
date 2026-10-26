"""Official SDK storage tests, entirely in memory; never deploys to a network."""
import json
import pytest

PROJECT = dict(name="Watershed restoration", description="Measurable impact", category="Reforestation",
               location="Vietnam", beneficiary="Local communities", website="https://example.org/project",
               objective="Increase survival", unit="surviving trees", baseline=0, target=100,
               deadline="2027-12-31", requirements="Independent report", methodology="Plot sampling")
MILESTONE = dict(outcome="Establish 50 surviving trees", target=50, deadline="2027-01-01",
                 method="Field survey", requirements="Independent audit", funding_reference="Grant A", allocation=100)


def test_sdk_storage_round_trip(direct_vm, direct_deploy, direct_alice):
    direct_vm.sender = direct_alice
    contract = direct_deploy("contracts/impact_proof.py", sdk_version="v0.2.16")
    assert contract.interface_version() == "impactproof/1"
    assert contract.create_project(json.dumps(PROJECT)) == "1"
    assert json.loads(contract.get_project("1"))["name"] == PROJECT["name"]
    assert contract.add_milestone("1", json.dumps(MILESTONE)) == "1:1"
    contract.submit_evidence("1:1", json.dumps({"urls":["https://example.org/report"],"explanation":"Independent measurement"}))
    assert json.loads(contract.get_milestone("1:1"))["status"] == "READY_FOR_VERIFICATION"
    assert len(json.loads(contract.get_evidence("1:1"))["submission_sha256"]) == 64
    assert contract.get_verdict("1:1") == "null"


def test_sdk_creator_access(direct_vm, direct_deploy, direct_alice, direct_bob):
    direct_vm.sender = direct_alice
    contract = direct_deploy("contracts/impact_proof.py", sdk_version="v0.2.16")
    contract.create_project(json.dumps(PROJECT))
    direct_vm.sender = direct_bob
    with pytest.raises(Exception, match="Creator only"):
        contract.add_milestone("1", json.dumps(MILESTONE))


def test_sdk_invalid_target(direct_vm, direct_deploy, direct_alice):
    direct_vm.sender = direct_alice
    contract = direct_deploy("contracts/impact_proof.py", sdk_version="v0.2.16")
    with pytest.raises(Exception, match="Invalid target"):
        contract.create_project(json.dumps(PROJECT | {"target": 0}))


@pytest.mark.parametrize("decision", ["APPROVED", "REJECTED", "NEEDS_REVIEW"])
def test_sdk_verification_storage(direct_vm, direct_deploy, direct_alice, monkeypatch, decision):
    direct_vm.sender = direct_alice
    contract = direct_deploy("contracts/impact_proof.py", sdk_version="v0.2.16")
    from genlayer import gl
    contract.create_project(json.dumps(PROJECT))
    contract.add_milestone("1", json.dumps(MILESTONE))
    contract.submit_evidence("1:1", json.dumps({"urls":["https://example.org/report"],"explanation":"Independent measurement"}))
    # Only external nondeterministic inputs are mocked; real SDK EP and storage run.
    monkeypatch.setattr(gl.nondet.web, "render", lambda *args, **kwargs: "Independent public measurements")
    monkeypatch.setattr(gl.nondet, "exec_prompt", lambda *args, **kwargs: {"decision":decision,"reason":"Measured evidence assessed against criteria","limitations":"Reports do not prove physical reality"})
    contract.verify_milestone("1:1")
    result = json.loads(contract.get_verdict("1:1"))
    assert result["decision"] == decision
    assert result["funding_eligible"] == (decision == "APPROVED")
    assert result["methodology"] == "impactproof/1"
    assert result["sources"][0]["available"] is True
    with pytest.raises(Exception, match="Already evaluated"):
        contract.verify_milestone("1:1")


def test_sdk_unavailable_source(direct_vm, direct_deploy, direct_alice, monkeypatch):
    direct_vm.sender = direct_alice
    contract = direct_deploy("contracts/impact_proof.py", sdk_version="v0.2.16")
    from genlayer import gl
    contract.create_project(json.dumps(PROJECT))
    contract.add_milestone("1", json.dumps(MILESTONE))
    contract.submit_evidence("1:1", json.dumps({"urls":["https://example.org/report"],"explanation":"Measurement"}))
    def unavailable(*args, **kwargs):
        raise RuntimeError("Source unavailable")
    monkeypatch.setattr(gl.nondet.web, "render", unavailable)
    contract.verify_milestone("1:1")
    assert json.loads(contract.get_verdict("1:1"))["decision"] == "NEEDS_REVIEW"
