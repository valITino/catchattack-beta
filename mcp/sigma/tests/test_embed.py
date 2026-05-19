from __future__ import annotations

from sigma_mcp.embed import HashEmbedder, cosine


def test_hash_embedder_is_deterministic() -> None:
    e = HashEmbedder(dim=64)
    a = e.embed("hello world")
    b = e.embed("hello world")
    assert a == b


def test_hash_embedder_distinguishes_obvious_pairs() -> None:
    e = HashEmbedder(dim=256)
    a = e.embed("powershell encoded command base64")
    b = e.embed("powershell encoded command base64 extra words")
    c = e.embed("network nmap port scan udp")
    assert cosine(a, b) > cosine(a, c)


def test_cosine_zero_for_empty_or_mismatched() -> None:
    assert cosine([], [1.0]) == 0.0
    assert cosine([1.0, 0.0], [0.0, 0.0]) == 0.0
    assert cosine([1.0], [1.0]) > 0.99


def test_hash_embedder_advertises_name() -> None:
    assert HashEmbedder().name == "hash-256"
    assert HashEmbedder(dim=32).name == "hash-32"
