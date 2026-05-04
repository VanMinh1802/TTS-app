"""Generic base service with shared CRUD operations."""
from typing import Generic, TypeVar, Optional
from app.repositories.base import BaseRepository

T = TypeVar("T")


class BaseService(Generic[T]):
    """Generic service with common CRUD, designed for simple entity services."""

    def __init__(self, repository: BaseRepository[T]):
        self.repo = repository

    def get(self, id: str) -> Optional[T]:
        return self.repo.get(id)

    def find_one(self, **filters) -> Optional[T]:
        return self.repo.find_one(**filters)

    def create(self, entity: T) -> T:
        return self.repo.create(entity)

    def delete(self, entity: T) -> None:
        self.repo.delete(entity)

    def exists(self, **filters) -> bool:
        return self.repo.exists(**filters)
