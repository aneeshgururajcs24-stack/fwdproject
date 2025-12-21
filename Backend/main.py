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
    Token,
    RecurringTransactionCreate,
    RecurringTransactionResponse,
    RecurringTransactionUpdate,
    GoalCreate,
    GoalResponse,
    GoalUpdate
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
    title="BudgetO API",
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
    return {"message": "BudgetO API with Authentication", "status": "running"}


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


@app.put(
    "/auth/profile",
    response_model=UserResponse,
    tags=["Authentication"]
)
async def update_profile(
    profile_data: dict,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()

    if "name" not in profile_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required"
        )

    result = await db.user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"name": profile_data["name"]}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or no changes made"
        )

    user = await db.user_collection.find_one({"_id": ObjectId(user_id)})
    return serialize_document(user)


@app.put(
    "/auth/password",
    tags=["Authentication"]
)
async def change_password(
    password_data: dict,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()

    if "current_password" not in password_data or "new_password" not in password_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password and new password are required"
        )

    user = await db.user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not verify_password(password_data["current_password"], user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password"
        )

    if len(password_data["new_password"]) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )

    hashed_password = get_password_hash(password_data["new_password"])
    await db.user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed_password}}
    )

    return {"message": "Password changed successfully"}


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


# ============================================
# RECURRING TRANSACTIONS ENDPOINTS
# ============================================

@app.post(
    "/recurring-transactions",
    response_model=RecurringTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Recurring Transactions"]
)
async def create_recurring_transaction(
    recurring_transaction: RecurringTransactionCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    recurring_dict = recurring_transaction.model_dump()
    recurring_dict["user_id"] = user_id
    recurring_dict["created_at"] = datetime.now(timezone.utc)

    result = await db.recurring_transaction_collection.insert_one(recurring_dict)
    created_recurring = await db.recurring_transaction_collection.find_one(
        {"_id": result.inserted_id}
    )

    return serialize_document(created_recurring)


@app.get(
    "/recurring-transactions",
    response_model=List[RecurringTransactionResponse],
    tags=["Recurring Transactions"]
)
async def get_recurring_transactions(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    recurring_transactions = []

    async for recurring in db.recurring_transaction_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1):
        recurring_transactions.append(serialize_document(recurring))

    return recurring_transactions


@app.get(
    "/recurring-transactions/{recurring_id}",
    response_model=RecurringTransactionResponse,
    tags=["Recurring Transactions"]
)
async def get_recurring_transaction(
    recurring_id: str,
    user_id: str = Depends(get_current_user_id)
):
    if not ObjectId.is_valid(recurring_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recurring transaction ID format"
        )

    db = get_database()
    recurring = await db.recurring_transaction_collection.find_one(
        {"_id": ObjectId(recurring_id), "user_id": user_id}
    )

    if not recurring:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring transaction not found"
        )

    return serialize_document(recurring)


@app.put(
    "/recurring-transactions/{recurring_id}",
    response_model=RecurringTransactionResponse,
    tags=["Recurring Transactions"]
)
async def update_recurring_transaction(
    recurring_id: str,
    recurring_transaction: RecurringTransactionUpdate,
    user_id: str = Depends(get_current_user_id)
):
    if not ObjectId.is_valid(recurring_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recurring transaction ID format"
        )

    db = get_database()
    update_data = recurring_transaction.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    result = await db.recurring_transaction_collection.update_one(
        {"_id": ObjectId(recurring_id), "user_id": user_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring transaction not found"
        )

    updated_recurring = await db.recurring_transaction_collection.find_one(
        {"_id": ObjectId(recurring_id)}
    )

    return serialize_document(updated_recurring)


@app.delete(
    "/recurring-transactions/{recurring_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Recurring Transactions"]
)
async def delete_recurring_transaction(
    recurring_id: str,
    user_id: str = Depends(get_current_user_id)
):
    if not ObjectId.is_valid(recurring_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recurring transaction ID format"
        )

    db = get_database()
    result = await db.recurring_transaction_collection.delete_one(
        {"_id": ObjectId(recurring_id), "user_id": user_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring transaction not found"
        )


# ============================================
# GOALS ENDPOINTS
# ============================================

@app.post(
    "/goals",
    response_model=GoalResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Goals"]
)
async def create_goal(
    goal: GoalCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    goal_dict = goal.model_dump()
    goal_dict["user_id"] = user_id
    goal_dict["created_at"] = datetime.now(timezone.utc)

    result = await db.goal_collection.insert_one(goal_dict)
    created_goal = await db.goal_collection.find_one(
        {"_id": result.inserted_id}
    )

    return serialize_document(created_goal)


@app.get(
    "/goals",
    response_model=List[GoalResponse],
    tags=["Goals"]
)
async def get_goals(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    goals = []

    async for goal in db.goal_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1):
        goals.append(serialize_document(goal))

    return goals


@app.get(
    "/goals/{goal_id}",
    response_model=GoalResponse,
    tags=["Goals"]
)
async def get_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id)
):
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid goal ID format"
        )

    db = get_database()
    goal = await db.goal_collection.find_one(
        {"_id": ObjectId(goal_id), "user_id": user_id}
    )

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    return serialize_document(goal)


@app.put(
    "/goals/{goal_id}",
    response_model=GoalResponse,
    tags=["Goals"]
)
async def update_goal(
    goal_id: str,
    goal: GoalUpdate,
    user_id: str = Depends(get_current_user_id)
):
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid goal ID format"
        )

    db = get_database()
    update_data = goal.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    result = await db.goal_collection.update_one(
        {"_id": ObjectId(goal_id), "user_id": user_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    updated_goal = await db.goal_collection.find_one(
        {"_id": ObjectId(goal_id)}
    )

    return serialize_document(updated_goal)


@app.delete(
    "/goals/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Goals"]
)
async def delete_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id)
):
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid goal ID format"
        )

    db = get_database()
    result = await db.goal_collection.delete_one(
        {"_id": ObjectId(goal_id), "user_id": user_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
