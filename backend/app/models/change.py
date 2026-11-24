from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.db import Base


class Change(Base):
    __tablename__ = "changes"

    id = Column(Integer, primary_key=True, index=True)

    website_id = Column(
        Integer,
        ForeignKey("websites.id"),
        nullable=False
    )

    old_snapshot_id = Column(
        Integer,
        ForeignKey("snapshots.id"),
        nullable=True
    )

    new_snapshot_id = Column(
        Integer,
        ForeignKey("snapshots.id"),
        nullable=False
    )

    summary = Column(Text, nullable=True)

    change_type = Column(
        String(100),
        default="content_update"
    )

    detected_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )