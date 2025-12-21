from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timezone
from enum import Enum


def get_utc_now():
    return datetime.now(timezone.utc)


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: EmailStr
    name: str
    created_at: datetime

    class Config:
        populate_by_name = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TransactionBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    type: TransactionType
    category: str = Field(..., min_length=1, max_length=50)
    date: datetime = Field(default_factory=get_utc_now)


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(TransactionBase):
    id: str = Field(alias="_id")
    user_id: str

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "description": "Salary",
                "amount": 5000.00,
                "type": "income",
                "category": "Job",
                "date": "2024-01-15T10:00:00",
                "user_id": "507f1f77bcf86cd799439012"
            }
        }


class TransactionUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[TransactionType] = None
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    date: Optional[datetime] = None


class SummaryResponse(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    transaction_count: int
