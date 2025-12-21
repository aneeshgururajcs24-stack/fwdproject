from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "finance_tracker"

    class Config:
        env_file = ".env"


class DatabaseManager:
    _instance: Optional['DatabaseManager'] = None
    _client: Optional[AsyncIOMotorClient] = None
    _database: Optional[AsyncIOMotorDatabase] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self.settings = Settings()
            self._client = AsyncIOMotorClient(self.settings.mongodb_url)
            self._database = self._client[self.settings.database_name]

    @property
    def database(self) -> AsyncIOMotorDatabase:
        if self._database is None:
            raise RuntimeError("Database not initialized")
        return self._database

    @property
    def transaction_collection(self):
        return self.database.get_collection("transactions")

    @property
    def user_collection(self):
        return self.database.get_collection("users")

    async def close(self):
        if self._client:
            self._client.close()
            self._client = None
            self._database = None


def get_database() -> DatabaseManager:
    return DatabaseManager()
