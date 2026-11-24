from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database.db import Base


class Website(Base):
    __tablename__ = "websites"

    id = Column(Integer, primary_key=True, index=True)

    url = Column(String(2048), unique=True, nullable=False)

    title = Column(String(500), nullable=True)

    category = Column(String(100), default="General")

    description = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    last_checked = Column(
        DateTime(timezone=True),
        nullable=True
    )