# ChangeWatch
# ChangeWatch — AI-Powered Website Change Monitoring

ChangeWatch is a website monitoring platform designed to track updates across public websites. It captures webpage content, stores snapshots, compares changes and maintains a history of detected updates.

## Problem Statement

Important information on websites such as scholarships, internships, hackathons, admissions and announcements can change frequently. Manually revisiting websites to identify updates is time-consuming.

ChangeWatch helps automate website monitoring and makes detected content changes easier to track.

## Features

- Add and monitor websites
- Extract webpage text
- Store website snapshots
- Compare webpage content using content hashes
- Detect content changes
- Maintain change history
- Automatically check websites every 5 minutes
- Dashboard for monitoring websites
- Website categorization
- Manual website checking

## Tech Stack

**Backend:** Python, FastAPI

**Database:** SQLite, SQLAlchemy

**Web Scraping:** Requests, BeautifulSoup

**Frontend:** HTML, CSS, JavaScript

**Scheduler:** APScheduler

## Project Structure

```text
ChangeWatch/
├── backend/
│   └── app/
│       ├── ai/
│       ├── monitoring/
│       ├── models/
│       ├── routes/
│       ├── schemas/
│       ├── services/
│       ├── database/
│       └── main.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── tests/
├── README.md
└── requirements.txt
```

## Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ChangeWatch
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate the environment

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```powershell
python -m pip install -r backend/requirements.txt
```

### 5. Initialize the database

```powershell
python -c "import sys; sys.path.insert(0, 'backend'); from app.database.init_db import create_tables; create_tables()"
```

### 6. Run the backend

```powershell
python -m uvicorn app.main:app --app-dir backend
```

Backend:

http://127.0.0.1:8000

API Documentation:

http://127.0.0.1:8000/docs

### 7. Run the frontend

Open `frontend/index.html` using the VS Code Live Server extension.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/websites/` | Add a website |
| GET | `/websites/` | List monitored websites |
| POST | `/websites/{website_id}/check` | Check for content changes |
| GET | `/websites/{website_id}/changes` | View change history |
| GET | `/health` | Check API health |

## How It Works

1. A user registers a website.
2. ChangeWatch retrieves and extracts webpage text.
3. The extracted content is stored as a snapshot.
4. A content hash is generated for comparison.
5. The webpage is periodically checked.
6. If the content differs from the previous snapshot, a change is recorded.
7. Users can review the recorded change history.

## Future Improvements

- AI-powered change summaries
- Relevance scoring for opportunities
- Deadline extraction
- Email notifications
- Advanced filtering and search
- Improved monitoring reliability

## Disclaimer

ChangeWatch is a prototype intended for monitoring publicly accessible websites where monitoring is permitted. Users should respect website terms, access restrictions and robots policies.

## Author

Developed as a personal software project to explore backend development, web monitoring, automation and full-stack integration.

