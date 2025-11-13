# backend/helpers/deploy_helper.py
"""
Helper to call the Node deploy script (deploy.cjs / deploy.js) and safely parse output.
Returns (result_dict, raw_output).
Result dict has keys: success (bool), appId (str|None), txId (str|None), error (str|None)
"""

import subprocess, json, os, shlex, sys

def run_node_deploy(env: dict = None, node_script_path: str = "src/lib/algorand/contracts/deploy.cjs", timeout: int = 20):
    env = env or {}
    # Merge with current environment
    env_full = os.environ.copy()
    env_full.update(env)

    # Try both .cjs and .js if present
    if not os.path.exists(node_script_path):
        alt = node_script_path.replace(".cjs", ".js")
        if os.path.exists(alt):
            node_script_path = alt

    cmd = ["node", node_script_path]
    try:
        # Use binary mode when reading to avoid encoding errors, then decode with errors='replace'
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env_full)
        out, _ = proc.communicate(timeout=timeout)
        raw = out.decode(errors="replace")
    except subprocess.TimeoutExpired:
        proc.kill()
        raw = ""
        return ({"success": False, "appId": None, "txId": None, "error": "Timeout running node deploy"}, raw)
    except FileNotFoundError as e:
        return ({"success": False, "appId": None, "txId": None, "error": f"Node not found: {e}"}, "")

    # Try to find a machine-friendly JSON line (APPLICATION_RESULT_JSON:{"success":...})
    app_result = {"success": False, "appId": None, "txId": None, "error": None}
    for line in raw.splitlines():
        line = line.strip()
        if line.startswith("APPLICATION_RESULT_JSON:"):
            try:
                payload = line.split("APPLICATION_RESULT_JSON:", 1)[1].strip()
                parsed = json.loads(payload)
                app_result["success"] = bool(parsed.get("success"))
                app_result["appId"] = parsed.get("appId")
                app_result["txId"] = parsed.get("txId")
                app_result["error"] = parsed.get("error")
                return (app_result, raw)
            except Exception:
                # ignore parse errors and continue
                pass

    # If not found, attempt to search for app id in the raw JSON-like object printed by script
    # Look for "applicationIndex" or "application-index" or "apid"
    import re
    m = re.search(r'"applicationIndex"\s*:\s*"?(\d+)"?', raw)
    if not m:
        m = re.search(r'"application-index"\s*:\s*"?(\d+)"?', raw)
    if not m:
        m = re.search(r'"applicationIndex"\s*:\s*"?(\d+)"?', raw, re.IGNORECASE)

    if m:
        app_result["appId"] = m.group(1)
        app_result["success"] = True
        # attempt tx id
        m2 = re.search(r'"txId"\s*:\s*"?([A-Z0-9]+)"?', raw)
        if m2:
            app_result["txId"] = m2.group(1)
        return (app_result, raw)

    # fallback: no app id found
    # also try to detect "Smart Contract Deployed!" with next lines
    if "Smart Contract Deployed" in raw or "✅ Smart Contract Deployed" in raw:
        # try to find any numeric-looking app id nearby
        m3 = re.search(r"Application ID[:\s]*([0-9]+)", raw)
        if m3:
            app_result["appId"] = m3.group(1)
            app_result["success"] = True
    # if nothing, return error containing stdout for debugging
    app_result["error"] = app_result["error"] or "No application id found in node output"
    return (app_result, raw)
