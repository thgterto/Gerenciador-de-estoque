import re
import sys
import os

def check_no_stack_trace_exposure(filepath):
    """
    Checks if a file exposes stack traces in JSON responses.
    """
    print(f"Scanning {filepath} for stack trace exposure...")
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        # Pattern to look for: key 'stack' associated with error.stack in a JSON object
        # This is a simple regex and might need adjustment for complex cases,
        # but works for the specific pattern identifying: stack: error.stack
        pattern = r"stack\s*:\s*\w+\.stack"

        match = re.search(pattern, content)
        if match:
            print(f"❌ SECURITY FAIL: Found stack trace exposure in {filepath}")
            print(f"   Match: {match.group(0)}")
            return False

        print(f"✅ SECURITY PASS: No stack trace exposure found in {filepath}")
        return True
    except FileNotFoundError:
        print(f"❌ Error: File not found: {filepath}")
        return False

def check_electron_window_handler(filepath):
    """
    Checks if setWindowOpenHandler is restrictive (returns deny by default).
    """
    print(f"Scanning {filepath} for secure window handler...")
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        # Check for presence of 'allow' action which is dangerous as fallback
        if "action: 'allow'" in content or 'action: "allow"' in content:
            print(f"❌ SECURITY FAIL: Found 'action: allow' in {filepath}. Window handler should deny by default.")
            return False

        # Check for presence of 'deny' action
        if "action: 'deny'" not in content and 'action: "deny"' not in content:
             print(f"❌ SECURITY FAIL: Did not find 'action: deny' in {filepath}.")
             return False

        print(f"✅ SECURITY PASS: Secure window handler pattern found in {filepath}")
        return True
    except FileNotFoundError:
        print(f"❌ Error: File not found: {filepath}")
        return False

if __name__ == "__main__":
    # 1. Check Google Apps Script (Legacy/Sync)
    filepath = "backend/GoogleAppsScript.js"
    if not os.path.exists(filepath):
        # Fallback for different CWD
        filepath = "../backend/GoogleAppsScript.js"

    if os.path.exists(filepath):
        if not check_no_stack_trace_exposure(filepath):
            sys.exit(1)
    else:
         print(f"Warning: Could not find backend file at {filepath}")

    # 2. Check Electron Main Process (New Architecture)
    electron_path = "electron/main.cjs"
    if not os.path.exists(electron_path):
        electron_path = "../electron/main.cjs"

    if os.path.exists(electron_path):
        if not check_electron_window_handler(electron_path):
             sys.exit(1)
    else:
        print(f"Warning: Could not find electron main file at {electron_path}")

    sys.exit(0)
