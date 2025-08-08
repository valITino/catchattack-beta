import os

import pytest

psycopg = pytest.importorskip("psycopg")


def test_tables_exist():
    dsn = os.getenv("DB_DSN", "postgresql://postgres:postgres@localhost:5432/catchattack")
    try:
        conn = psycopg.connect(dsn)
    except psycopg.OperationalError:
        pytest.skip("Database not reachable")

    with conn:
        cur = conn.cursor()
        cur.execute("select tablename from pg_tables where schemaname='public'")
        names = {r[0] for r in cur.fetchall()}
        for t in [
            "rules",
            "customizations",
            "attack_runs",
            "detection_results",
            "validation_status",
            "deploy_jobs",
            "deploy_versions",
            "threat_profile",
        ]:
            assert t in names
