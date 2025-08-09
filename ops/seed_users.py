import os
import uuid
from passlib.hash import bcrypt
from sqlalchemy import create_engine, text

dsn = os.getenv("DB_DSN", "postgresql+psycopg://postgres:postgres@db:5432/catchattack")
e = create_engine(dsn, future=True)
users = [
    ("admin", "adminpass", "admin"),
    ("analyst", "analystpass", "analyst"),
    ("viewer", "viewerpass", "viewer"),
]
with e.begin() as c:
    for u, p, r in users:
        ph = bcrypt.hash(p)
        c.execute(
            text(
                "insert into users (id,username,password_hash,role,created_at,updated_at) values (:id,:u,:ph,:r, now(), now()) on conflict (username) do nothing"
            ),
            {"id": str(uuid.uuid4()), "u": u, "ph": ph, "r": r},
        )
print("Seeded users.")
