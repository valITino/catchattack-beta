import re

DANGEROUS_PATTERNS = [
    r"Invoke-WebRequest\s+http", r"curl\s+-O\s+http", r"certutil\s+-urlcache",
    r"powershell\s+-enc", r"nc\s+-e", r"bash\s+-i\s*>&", r"rm\s+-rf\s+/",
    r"Disable(-| )?(Security|Defender)", r"mimikatz", r"rundll32.+comsvcs"
]


def sanitize_script(script: str) -> tuple[str, list[str]]:
    notes = []
    clean = script
    for pat in DANGEROUS_PATTERNS:
        if re.search(pat, clean, flags=re.I):
            clean = re.sub(pat, "# [REMOVED UNSAFE OPERATION]", clean, flags=re.I)
            notes.append(f"Removed pattern: {pat}")
    # Block external network destinations; replace with echo placeholders
    clean = re.sub(r"(curl|wget|Invoke-WebRequest)\s+(\S+)", r'echo "Requested fetch \2 (blocked)"', clean, flags=re.I)
    return clean, notes
