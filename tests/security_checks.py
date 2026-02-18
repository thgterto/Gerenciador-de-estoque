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

def check_formula_injection_protection(filepath):
    """
    Checks if GoogleAppsScript.js contains sanitization for Formula Injection.
    """
    print(f"Scanning {filepath} for Formula Injection protection...")
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        # Check for sanitizeForSheet definition
        if "function sanitizeForSheet(value)" not in content:
            print(f"❌ SECURITY FAIL: sanitizeForSheet function not found in {filepath}")
            return False

        # Check for usage in upsertData
        # Simple check: does "sanitizeForSheet(" appear inside upsertData?
        # This is a heuristic.
        upsert_data_match = re.search(r"function upsertData[\s\S]*?}", content)
        if not upsert_data_match:
             print(f"❌ FAIL: upsertData function not found in {filepath}")
             return False

        upsert_body = upsert_data_match.group(0)
        if "sanitizeForSheet(" not in upsert_body:
             print(f"❌ SECURITY FAIL: sanitizeForSheet not used in upsertData in {filepath}")
             return False

        print(f"✅ SECURITY PASS: Formula Injection protection found in {filepath}")
        return True
    except FileNotFoundError:
        print(f"❌ Error: File not found: {filepath}")
        return False

if __name__ == "__main__":
    filepath = "backend/GoogleAppsScript.js"
    if not os.path.exists(filepath):
        # Fallback for different CWD
        filepath = "../backend/GoogleAppsScript.js"

    if not os.path.exists(filepath):
         print(f"Could not find file at {filepath}")
         sys.exit(1)

    if not check_no_stack_trace_exposure(filepath):
        sys.exit(1)

    if not check_formula_injection_protection(filepath):
        sys.exit(1)

    sys.exit(0)
