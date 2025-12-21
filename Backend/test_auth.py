import asyncio
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Test registration
print("Testing registration...")
response = client.post(
    "/auth/register",
    json={"email": "bob@example.com", "password": "bob12345", "name": "Bob"}
)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 201:
    print("\nTesting login...")
    response = client.post(
        "/auth/login",
        json={"email": "bob@example.com", "password": "bob12345"}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
