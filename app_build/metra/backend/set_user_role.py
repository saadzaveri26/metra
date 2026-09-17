"""
CLI helper to assign METRA roles directly to Clerk accounts for testing.
Usage:
    python set_user_role.py <email_or_user_id> <role>

Supported roles:
    consumer
    vendor
    officer
    headquarters (or hq)
"""

import sys
import os
import json
import urllib.request
from pathlib import Path

# Load from environment, or read from .env.local if present
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")
if not CLERK_SECRET_KEY:
    env_local_path = Path(__file__).resolve().parent.parent / ".env.local"
    if env_local_path.exists():
        with open(env_local_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("CLERK_SECRET_KEY="):
                    CLERK_SECRET_KEY = line.strip().split("=", 1)[1].strip()
                    break


def set_role(identifier: str, target_role: str):
    target_role = target_role.lower().strip()
    if target_role in ["hq", "headquarter"]:
        target_role = "headquarters"
    if target_role == "inspector":
        target_role = "officer"

    valid_roles = ["consumer", "vendor", "officer", "headquarters"]
    if target_role not in valid_roles:
        print(f"Error: Invalid role '{target_role}'. Valid choices are: {', '.join(valid_roles)}")
        return

    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "User-Agent": "metra-admin-tool",
        "Content-Type": "application/json"
    }

    # 1. Look up user
    user_id = identifier
    if not identifier.startswith("user_"):
        # Search by email
        req = urllib.request.Request(
            f"https://api.clerk.com/v1/users?email_address={urllib.parse.quote(identifier)}",
            headers=headers
        )
        try:
            with urllib.request.urlopen(req) as resp:
                users = json.loads(resp.read().decode())
                if not users:
                    print(f"No Clerk user found with email: {identifier}")
                    return
                user_id = users[0]["id"]
        except Exception as e:
            print(f"Failed to lookup user: {e}")
            return

    # 2. Build metadata
    if target_role == "officer":
        metadata = {
            "role": "officer",
            "inspector_verified": True,
            "status": "active"
        }
    elif target_role == "headquarters":
        metadata = {
            "role": "headquarters",
            "status": "active"
        }
    else:
        metadata = {
            "role": target_role
        }

    # 3. Update metadata in Clerk
    data = json.dumps({"public_metadata": metadata}).encode("utf-8")
    patch_req = urllib.request.Request(
        f"https://api.clerk.com/v1/users/{user_id}/metadata",
        data=data,
        headers=headers,
        method="PATCH"
    )

    try:
        with urllib.request.urlopen(patch_req) as resp:
            res = json.loads(resp.read().decode())
            print(f"\n Successfully updated {identifier} (ID: {user_id})")
            print(f" New Role: {target_role.upper()}")
            print(f" Public Metadata: {res.get('public_metadata')}")
            print(f" Direct Portal URL: http://localhost:3000/{target_role}")
    except Exception as e:
        print(f"Failed to update metadata: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        # Also print current users to assist
        headers = {
            "Authorization": f"Bearer {CLERK_SECRET_KEY}",
            "User-Agent": "metra-admin-tool"
        }
        try:
            req = urllib.request.Request("https://api.clerk.com/v1/users?limit=10", headers=headers)
            with urllib.request.urlopen(req) as resp:
                users = json.loads(resp.read().decode())
                print("\nRegistered Clerk accounts available to switch:")
                for u in users:
                    em = u.get("email_addresses", [{}])[0].get("email_address", "no-email")
                    meta = u.get("public_metadata", {})
                    print(f"  - {em:35} -> Role: {meta.get('role', 'none')} (Verified: {meta.get('inspector_verified', 'N/A')})")
        except Exception:
            pass
        sys.exit(1)

    set_role(sys.argv[1], sys.argv[2])
