
#!/usr/bin/env python3

"""
Historical Git Commit Wrapper
African AI Governance Research

Selects an unused date between 2020 and 2025,
checks all locally available Git refs, and creates
a commit with the selected author and committer dates.

Requirements:
    - Python 3.8+
    - Git installed and accessible through PATH

Usage:
    python git-historical-commit.py -m "Research update"

    python git-historical-commit.py
    (Opens the normal Git commit editor)
"""

import os
import sys
import random
import subprocess
from datetime import date, datetime, timedelta, timezone


START_DATE = date(2020, 1, 1)
END_DATE = date(2025, 12, 31)


def run_git(args, env=None):
    """Execute a Git command and return its output."""
    return subprocess.run(
        ["git"] + args,
        check=True,
        text=True,
        capture_output=True,
        env=env
    )


def verify_repository():
    """Ensure execution takes place inside a Git repository."""
    try:
        run_git(["rev-parse", "--git-dir"])
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("[ERROR] Current directory is not a Git repository.")
        sys.exit(1)


def get_used_dates():
    """
    Collect author and committer dates from all commits
    reachable through locally available refs.

    Both timestamps are converted to UTC before
    extracting their calendar dates.
    """

    try:
        result = run_git([
            "log",
            "--all",
            "--format=%aI%x09%cI"
        ])

    except subprocess.CalledProcessError as error:
        print("[ERROR] Unable to read Git history.")
        print(error.stderr)
        sys.exit(1)

    used_dates = set()

    for line in result.stdout.splitlines():

        parts = line.split("\t")

        if len(parts) != 2:
            continue

        for timestamp in parts:

            try:
                parsed = datetime.fromisoformat(timestamp)

                utc_date = (
                    parsed
                    .astimezone(timezone.utc)
                    .date()
                )

                used_dates.add(utc_date)

            except ValueError:
                continue

    return used_dates


def get_available_dates(used_dates):
    """Return every unused calendar date in the target range."""

    available = []

    current_date = START_DATE

    while current_date <= END_DATE:

        if current_date not in used_dates:
            available.append(current_date)

        current_date += timedelta(days=1)

    return available


def select_random_date(available_dates):
    """Select one unused date uniformly at random."""

    if not available_dates:
        print("[ERROR] No unused dates remain between 2020 and 2025.")
        sys.exit(1)

    return random.SystemRandom().choice(available_dates)


def create_commit(selected_date, commit_args):
    """
    Set actual Git author and committer dates,
    then execute the user's original Git commit arguments.
    """

    timestamp = (
        datetime.combine(
            selected_date,
            datetime.min.time()
        )
        .replace(hour=12, tzinfo=timezone.utc)
        .isoformat()
    )

    env = os.environ.copy()

    env["GIT_AUTHOR_DATE"] = timestamp
    env["GIT_COMMITTER_DATE"] = timestamp

    print()
    print("[COMMIT HOOK] Historical date selected:", selected_date)
    print("[COMMIT HOOK] Author date:", timestamp)
    print("[COMMIT HOOK] Committer date:", timestamp)
    print()

    try:

        subprocess.run(
            ["git", "commit"] + commit_args,
            env=env,
            check=True
        )

    except subprocess.CalledProcessError as error:

        print("[ERROR] Git commit failed.")
        sys.exit(error.returncode)


def main():

    verify_repository()

    used_dates = get_used_dates()

    available_dates = get_available_dates(used_dates)

    print("[INFO] Repository history inspected.")
    print("[INFO] Dates already used:", len(used_dates))
    print("[INFO] Available dates:", len(available_dates))

    selected_date = select_random_date(available_dates)

    commit_args = sys.argv[1:]

    create_commit(selected_date, commit_args)


if __name__ == "__main__":
    main()
