# Finance Tracker

A simple full-stack finance tracker application for managing income and expenses.

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite
- **Database**: MongoDB

## Features

- Add income and expense transactions
- View all transactions with details
- Delete transactions
- Real-time financial summary (total income, expenses, and balance)
- Clean and responsive UI

## Project Structure

```
Finance Tracker/
├── Backend/
│   ├── main.py              # FastAPI application
│   ├── models.py            # Pydantic models
│   ├── database.py          # MongoDB connection (Singleton)
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
└── Frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── App.jsx          # Main app component
    │   ├── api.js           # API service
    │   └── main.jsx         # Entry point
    ├── package.json         # Node dependencies
    └── vite.config.js       # Vite configuration
```

## Prerequisites

1. **Python 3.9+** - [Download Python](https://www.python.org/downloads/)
2. **Node.js 18+** - [Download Node.js](https://nodejs.org/)
3. **MongoDB** - [Download MongoDB](https://www.mongodb.com/try/download/community)

## Setup Instructions

### 1. Install MongoDB

**Windows:**
- Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
- Run the installer and follow the setup wizard
- MongoDB will start automatically as a service on port 27017

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

Verify MongoDB is running:
```bash
mongosh
```
If you see the MongoDB shell, it's running correctly. Type `exit` to quit.

### 2. Backend Setup

Open a terminal in the `Backend` folder:

```bash
cd Backend
```

Create a Python virtual environment:
```bash
python -m venv venv
```

Activate the virtual environment:
- **Windows**: `venv\Scripts\activate`
- **macOS/Linux**: `source venv/bin/activate`

Install dependencies using uv:
```bash
uv pip install -r requirements.txt
```

Create environment file:
```bash
cp .env.example .env
```

The default `.env` values work for local development:
```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=finance_tracker
```

Start the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 3. Frontend Setup

Open a **new terminal** in the `Frontend` folder:

```bash
cd Frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## Usage

1. Make sure MongoDB is running
2. Start the backend server (Terminal 1)
3. Start the frontend server (Terminal 2)
4. Open http://localhost:3000 in your browser
5. Add your first transaction using the form
6. View your financial summary and transaction history

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/transactions` | Get all transactions |
| GET | `/transactions/{id}` | Get single transaction |
| POST | `/transactions` | Create transaction |
| PUT | `/transactions/{id}` | Update transaction |
| DELETE | `/transactions/{id}` | Delete transaction |
| GET | `/summary` | Get financial summary |

## Development Notes

### Backend
- Singleton pattern for database connection
- Async/await for all database operations
- Proper error handling and validation
- CORS enabled for frontend communication

### Frontend
- React functional components with hooks
- Axios for API calls
- Clean component structure
- Responsive design

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running: `mongosh` to test connection
- Check if MongoDB is on port 27017: `netstat -an | grep 27017`

**Backend won't start:**
- Verify virtual environment is activated
- Check all dependencies are installed: `uv pip list`
- Ensure port 8000 is not in use

**Frontend won't start:**
- Delete `node_modules` and run `npm install` again
- Check port 3000 is available
- Clear npm cache: `npm cache clean --force`

**Can't connect to API:**
- Verify backend is running on http://localhost:8000
- Check browser console for CORS errors
- Ensure firewall isn't blocking the connection

## License

MIT License - Free to use for educational purposes
