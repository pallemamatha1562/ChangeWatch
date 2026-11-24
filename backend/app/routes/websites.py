
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models import Website, Snapshot, Change
from app.schemas.website_schema import WebsiteCreate
from app.services.website_service import fetch_website


router = APIRouter(prefix="/websites", tags=["Websites"])


# --------------------------------------------------
# 1. ADD A WEBSITE
# --------------------------------------------------

@router.post("/")
def add_website(
    website_data: WebsiteCreate,
    db: Session = Depends(get_db)
):

    url = str(website_data.url)

    existing = db.query(Website).filter(
        Website.url == url
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="This website is already being monitored."
        )

    try:
        result = fetch_website(url)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not fetch the website."
        )

    new_website = Website(
        url=url,
        title=result["title"],
        category=website_data.category,
        description=website_data.description
    )

    db.add(new_website)
    db.flush()

    snapshot = Snapshot(
        website_id=new_website.id,
        content=result["content"],
        content_hash=result["content_hash"]
    )

    db.add(snapshot)
    db.commit()
    db.refresh(new_website)

    return {
        "message": "Website added successfully!",
        "website": {
            "id": new_website.id,
            "url": new_website.url,
            "title": new_website.title,
            "category": new_website.category,
            "description": new_website.description
        },
        "snapshot": {
            "content_length": len(result["content"]),
            "content_hash": result["content_hash"]
        }
    }


# --------------------------------------------------
# 2. LIST ALL MONITORED WEBSITES
# --------------------------------------------------

@router.get("/")
def get_websites(db: Session = Depends(get_db)):

    websites = db.query(Website).all()

    return {
        "total": len(websites),
        "websites": [
            {
                "id": website.id,
                "url": website.url,
                "title": website.title,
                "category": website.category,
                "description": website.description,
                "last_checked": website.last_checked
            }
            for website in websites
        ]
    }


# --------------------------------------------------
# 3. CHECK A WEBSITE FOR CHANGES
# --------------------------------------------------

@router.post("/{website_id}/check")
def check_website(
    website_id: int,
    db: Session = Depends(get_db)
):

    website = db.query(Website).filter(
        Website.id == website_id
    ).first()

    if not website:
        raise HTTPException(
            status_code=404,
            detail="Website not found"
        )

    try:
        result = fetch_website(website.url)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not check the website."
        )

    latest_snapshot = (
        db.query(Snapshot)
        .filter(Snapshot.website_id == website_id)
        .order_by(Snapshot.id.desc())
        .first()
    )

    website.last_checked = datetime.now(timezone.utc)

    # Check whether the content is unchanged
    if (
        latest_snapshot
        and latest_snapshot.content_hash == result["content_hash"]
    ):

        db.commit()

        return {
            "message": "No changes detected.",
            "website": website.title,
            "changed": False
        }

    # Store a new snapshot if content has changed
    new_snapshot = Snapshot(
        website_id=website_id,
        content=result["content"],
        content_hash=result["content_hash"]
    )

    db.add(new_snapshot)
    db.flush()

    # Record the detected change
    new_change = Change(
        website_id=website_id,
        old_snapshot_id=(
            latest_snapshot.id if latest_snapshot else None
        ),
        new_snapshot_id=new_snapshot.id,
        summary="Website content changed.",
        change_type="content_update"
    )

    db.add(new_change)
    db.commit()

    return {
        "message": "Website change detected!",
        "website": website.title,
        "changed": True,
        "change_id": new_change.id
    }


# --------------------------------------------------
# 4. GET WEBSITE CHANGE HISTORY
# --------------------------------------------------

@router.get("/{website_id}/changes")
def get_website_changes(
    website_id: int,
    db: Session = Depends(get_db)
):

    website = db.query(Website).filter(
        Website.id == website_id
    ).first()

    if not website:
        raise HTTPException(
            status_code=404,
            detail="Website not found"
        )

    changes = (
        db.query(Change)
        .filter(Change.website_id == website_id)
        .order_by(Change.id.desc())
        .all()
    )

    return {
        "website": website.title,
        "total_changes": len(changes),
        "changes": [
            {
                "id": change.id,
                "summary": change.summary,
                "change_type": change.change_type,
                "detected_at": change.detected_at
            }
            for change in changes
        ]
    }
@router.delete("/{website_id}")
def delete_website(website_id: int, db: Session = Depends(get_db)):
    website = db.query(Website).filter(Website.id == website_id).first()

    if not website:
        raise HTTPException(status_code=404, detail="Website not found")

    db.delete(website)
    db.commit()

    return {
        "message": "Website deleted successfully",
        "website_id": website_id
    }