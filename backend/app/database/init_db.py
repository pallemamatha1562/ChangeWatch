from app.database.db import Base, engine
from app.models import Website, Snapshot, Change


def create_tables():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_tables()
    print("ChangeWatch database tables created successfully!")