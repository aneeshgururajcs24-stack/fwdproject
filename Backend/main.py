from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from bson import ObjectId
from typing import List
from datetime import datetime, timedelta, timezone

from database import get_database
from models import (
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
    SummaryResponse,
    TransactionType,
    UserCreate,
    UserLogin,
    UserResponse,
    Token
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user_id
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    db_manager = get_database()
    await db_manager.close()


app = FastAPI(
    title="Finance Tracker API",
    description="Simple finance tracker for managing income and expenses with user authentication",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def serialize_document(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


@app.get("/", tags=["Root"])
async def root():
    return {"message": "Finance Tracker API with Authentication", "status": "running"}


@app.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"]
)
async def register(user: UserCreate):
    db = get_database()

    existing_user = await db.user_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user_dict = {
        "email": user.email,
        "password": get_password_hash(user.password),
        "name": user.name,
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.user_collection.insert_one(user_dict)
    created_user = await db.user_collection.find_one({"_id": result.inserted_id})

    return serialize_document(created_user)


@app.post(
    "/auth/login",
    response_model=Token,
    tags=["Authentication"]
)
async def login(credentials: UserLogin):
    db = get_database()

    user = await db.user_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(data={"sub": str(user["_id"])})

    return Token(access_token=access_token, token_type="bearer")


@app.get(
    "/auth/me",
    response_model=UserResponse,
    tags=["Authentication"]
)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    db = get_database()

    user = await db.user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return serialize_document(user)


@app.post(
    "/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Transactions"]
)
async def create_transaction(
    transaction: TransactionCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    transaction_dict = transaction.model_dump()
    transaction_dict["user_id"] = user_id

    result = await db.transaction_collection.insert_one(transaction_dict)
    created_transaction = await db.transaction_collection.find_one(
        {"_id": result.inserted_id}
    )

    return serialize_document(created_transaction)


@app.get(
    "/transactions",
    response_model=List[TransactionResponse],
    tags=["Transactions"]
)
async def get_transactions(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    transactions = []

    async for transaction in db.transaction_collection.find(
        {"user_id": user_id}
    ).sort("date", -1):
        transactions.append(serialize_document(transaction))

    return transactions


@app.get(
    "/transactions/{transaction_id}",
    response_model=TransactionResponse,
    tags=["Transactions"]
)
async def get_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id)
):
    if not ObjectId.is_valid(transaction_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format"
        )

    db = get_database()
    transaction = await db.transaction_collection.find_one(
        {"_id": ObjectId(transaction_id), "user_id": user_id}
    )

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    return serialize_document(transaction)


@app.put(
    "/transactions/{transaction_id}",
    response_model=TransactionResponse,
    tags=["Transactions"]
)
async def update_transaction(
    transaction_id: str,
    transaction: TransactionUpdate,
    user_id: str = Depends(get_current_user_id)
):
    if not ObjectId.is_valid(transaction_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format"
        )

    db = get_database()
    update_data = transaction.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    result = await db.transaction_collection.update_one(
        {"_id": ObjectId(transaction_id), "user_id": user_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    updated_transaction = await db.transaction_collection.find_one(
        {"_id": ObjectId(transaction_id)}
    )

    return serialize_document(updated_transaction)


@app.delete(
    "/transactions/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Transactions"]
)
async def delete_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id)
):
    if not ObjectId.is_valid(transaction_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format"
        )

    db = get_database()
    result = await db.transaction_collection.delete_one(
        {"_id": ObjectId(transaction_id), "user_id": user_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )


@app.get(
    "/summary",
    response_model=SummaryResponse,
    tags=["Summary"]
)
async def get_summary(user_id: str = Depends(get_current_user_id)):
    db = get_database()

    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"}
            }
        }
    ]

    results = await db.transaction_collection.aggregate(pipeline).to_list(None)
    transaction_count = await db.transaction_collection.count_documents({"user_id": user_id})

    total_income = 0.0
    total_expense = 0.0

    for result in results:
        if result["_id"] == TransactionType.INCOME:
            total_income = result["total"]
        elif result["_id"] == TransactionType.EXPENSE:
            total_expense = result["total"]

    return SummaryResponse(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transaction_count=transaction_count
    )
