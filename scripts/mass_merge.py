import subprocess
import sys

def run_git_command(command):
    try:
        result = subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return None

def get_remote_branches():
    # Fetch all branches from origin
    # Sort by committerdate (oldest first)
    command = ["git", "for-each-ref", "--sort=committerdate", "refs/remotes/origin/", "--format=%(refname:short)"]
    output = run_git_command(command)
    if not output:
        return []
    return output.splitlines()

def merge_branch(branch):
    print(f"Attempting merge for {branch}...")
    command = ["git", "merge", "--no-ff", "--no-edit", branch]
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(f"SUCCESS: Merged {branch}")
        return True
    except subprocess.CalledProcessError:
        print(f"CONFLICT: Failed to merge {branch}. Aborting...")
        subprocess.run(["git", "merge", "--abort"], check=False)
        return False

def main():
    branches = get_remote_branches()
    if not branches:
        print("No remote branches found or error fetching.")
        return

    success_count = 0
    fail_count = 0
    report = []

    print(f"Found {len(branches)} remote branches.")

    for branch in branches:
        # Filter out irrelevant branches
        if "HEAD" in branch or "main" in branch or "jules-integration-all" in branch:
            continue

        success = merge_branch(branch)
        if success:
            success_count += 1
            report.append(f"- [x] {branch}")
        else:
            fail_count += 1
            report.append(f"- [ ] {branch} (Conflict)")

    with open("merge_report.md", "w") as f:
        f.write("# Mass Merge Report\n\n")
        f.write(f"Total branches processed: {success_count + fail_count}\n")
        f.write(f"Success: {success_count}\n")
        f.write(f"Failed (Conflict): {fail_count}\n\n")
        f.write("## Details\n")
        for line in report:
            f.write(f"{line}\n")

    print(f"\nMerge complete. Success: {success_count}, Failed: {fail_count}. See merge_report.md for details.")

if __name__ == "__main__":
    main()
