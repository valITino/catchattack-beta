from pathlib import Path
from app.services.sigma_eval.engine import evaluate_local

def test_local_engine_hits(tmp_path: Path):
    yml = """title: t
logsource: {product: windows}
detection:
  sel:
    process.command_line|contains: "-EncodedCommand"
  condition: sel
level: low
"""
    f = tmp_path/"e.ndjson"
    f.write_text('{"process":{"command_line":"powershell -EncodedCommand AA=="}}\n', encoding="utf-8")
    hits, samples = evaluate_local(yml, f)
    assert hits == 1 and samples
