import subprocess
import json
from datetime import datetime

def run_command(command):
    try:
        result = subprocess.run(command, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return result.stdout.strip()
    except Exception:
        return ""

def get_branches():
    # Get all remote branches with date
    cmd = ["git", "for-each-ref", "--sort=-committerdate", "refs/remotes/origin/", "--format=%(refname:short)|%(committerdate:iso)"]
    output = run_command(cmd)
    branches = []
    for line in output.splitlines():
        if "|" in line:
            name, date_str = line.split("|")
            branches.append({"name": name, "date": date_str})
    return branches

def analyze_branch(branch, main_branch="origin/main"):
    # Check if unrelated
    cmd = ["git", "merge-base", main_branch, branch["name"]]
    merge_base = run_command(cmd)

    status = "related" if merge_base else "unrelated"

    return {
        "name": branch["name"],
        "date": branch["date"],
        "status": status
    }

def main():
    branches = get_branches()
    print(f"Found {len(branches)} branches. Analyzing top 20 recent ones...")

    results = []
    count = 0
    for b in branches:
        if "HEAD" in b["name"] or "main" in b["name"]:
            continue

        # Only check 2026 branches or top 20
        if "2026" in b["date"] or count < 20:
            info = analyze_branch(b)
            results.append(info)
            count += 1
            print(f"Analyzed {b['name']}: {info['status']}")

    with open("branch_analysis.json", "w") as f:
        json.dump(results, f, indent=2)

    print("\nSummary:")
    for r in results:
        print(f"{r['date']} - {r['name']} [{r['status']}]")

if __name__ == "__main__":
    main()
