import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import Base
from app.models.user import User
from app.schemas.project import ProjectCreate
from app.services.project_service import ProjectService


@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_create_project(db_session):
    user = User(email="test@example.com", password_hash="hashed", name="Tester")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    service = ProjectService(db_session)
    project = service.create_project(
        user_id=user.id,
        data=ProjectCreate(name="Test Project", description=None),
    )

    assert project.name == "Test Project"
    assert project.user_id == user.id
