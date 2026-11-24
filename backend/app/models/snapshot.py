from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.db import Base


class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True, index=True)

    website_id = Column(
        Integer,
        ForeignKey("websites.id"),
        nullable=False
    )

    content = Column(Text, nullable=False)

    content_hash = Column(Text, nullable=False)

    captured_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )