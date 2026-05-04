"""Generic base repository with common CRUD operations."""
from typing import Generic, TypeVar, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic repository with common database operations."""

    def __init__(self, model: type[ModelType], session: Session):
        self.model = model
        self.session = session

    def get(self, id: str) -> Optional[ModelType]:
        return self.session.get(self.model, id)

    def get_for_update(self, id: str) -> Optional[ModelType]:
        return self.session.execute(
            select(self.model)
            .where(self.model.id == id)
            .with_for_update()
        ).scalar_one_or_none()

    def find_one(self, **filters) -> Optional[ModelType]:
        return self.session.execute(
            select(self.model).filter_by(**filters)
        ).scalar_one_or_none()

    def find_all(self, **filters) -> list[ModelType]:
        return self.session.execute(
            select(self.model).filter_by(**filters)
        ).scalars().all()

    def paginate(
        self,
        page: int = 1,
        per_page: int = 50,
        order_by=None,
        **filters,
    ) -> tuple[list[ModelType], int]:
        query = select(self.model).filter_by(**filters)
        total = self.session.execute(
            select(func.count()).select_from(self.model).filter_by(**filters)
        ).scalar() or 0
        if order_by is not None:
            query = query.order_by(order_by)
        items = self.session.execute(
            query.offset((page - 1) * per_page).limit(per_page)
        ).scalars().all()
        return items, total

    def create(self, entity: ModelType) -> ModelType:
        self.session.add(entity)
        self.session.flush()
        return entity

    def add(self, entity: ModelType) -> ModelType:
        return self.create(entity)

    def delete(self, entity: ModelType) -> None:
        self.session.delete(entity)

    def exists(self, **filters) -> bool:
        return self.session.execute(
            select(func.count())
            .select_from(self.model)
            .filter_by(**filters)
        ).scalar() > 0
