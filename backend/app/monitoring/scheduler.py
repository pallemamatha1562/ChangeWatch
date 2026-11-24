
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.database.db import SessionLocal
from app.models import Website, Snapshot, Change
from app.services.website_service import fetch_website


def monitor_websites():
    """Periodically check saved websites for content changes."""

    db = SessionLocal()

    try:
        websites = db.query(Website).all()

        for website in websites:
            try:
                result = fetch_website(website.url)

                latest_snapshot = (
                    db.query(Snapshot)
                    .filter(Snapshot.website_id == website.id)
                    .order_by(Snapshot.id.desc())
                    .first()
                )

                website.last_checked = datetime.now(timezone.utc)

                # Skip saving a new snapshot if content is unchanged
                if (
                    latest_snapshot
                    and latest_snapshot.content_hash
                    == result["content_hash"]
                ):
                    db.commit()
                    continue

                # Save the new snapshot
                new_snapshot = Snapshot(
                    website_id=website.id,
                    content=result["content"],
                    content_hash=result["content_hash"]
                )

                db.add(new_snapshot)
                db.flush()

                # Record the detected change
                new_change = Change(
                    website_id=website.id,
                    old_snapshot_id=(
                        latest_snapshot.id if latest_snapshot else None
                    ),
                    new_snapshot_id=new_snapshot.id,
                    summary="Website content changed.",
                    change_type="content_update"
                )

                db.add(new_change)
                db.commit()

                print(f"Change detected: {website.url}")

            except Exception as error:
                db.rollback()
                print(f"Monitoring failed for {website.url}: {error}")

    finally:
        db.close()


scheduler = BackgroundScheduler()


def start_scheduler():
    """Start automatic monitoring."""

    if scheduler.running:
        return

    scheduler.add_job(
        monitor_websites,
        trigger="interval",
        minutes=5,
        id="website_monitor",
        replace_existing=True,
        max_instances=1
    )

    scheduler.start()

    print("ChangeWatch automatic monitoring started!")
    print("Websites will be checked every 5 minutes.")
