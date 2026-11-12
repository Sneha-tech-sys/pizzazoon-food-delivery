# 🚀 PizzaZoon - Full-Stack Deployment Guide

This guide explains how to open the project in VS Code, push it to GitHub, and host the PostgreSQL database, FastAPI backend, and React frontend live on the internet.

---

## 1. 💻 How to Open the Project in VS Code

### Method A (From Command Prompt / PowerShell)
Open your terminal and run:
```powershell
cd C:\Users\Sneha\Desktop\Fooddelevery
code .
```

### Method B (From VS Code App)
1. Open **Visual Studio Code**.
2. Click **File** ➔ **Open Folder...** (Shortcut: `Ctrl + K, Ctrl + O`).
3. Select `C:\Users\Sneha\Desktop\Fooddelevery` and click **Select Folder**.

---

## 2. 🐙 How to Push to GitHub

A `.gitignore` file has already been created to protect your `node_modules/`, Python `venv/`, and sensitive `.env` credentials.

### Step 1: Create a Repository on GitHub
1. Go to [https://github.com/new](https://github.com/new).
2. Name your repository (e.g. `pizzazoon-food-delivery`).
3. Set it to **Public** or **Private**.
4. Leave all checkboxes (README, .gitignore, license) **unchecked**.
5. Click **Create repository**.

### Step 2: Push Your Code from Terminal
Open PowerShell in your project folder (`C:\Users\Sneha\Desktop\Fooddelevery`) and run:

```powershell
git init
git add .
git commit -m "feat: complete pizza delivery full-stack application"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```
*(Replace `<YOUR_GITHUB_USERNAME>` and `<YOUR_REPOSITORY_NAME>` with your GitHub details).*

---

## 3. 🌐 How to Host the Full-Stack Application with Database

We recommend **Render.com** (or **Neon + Render + Vercel**) because it provides free managed PostgreSQL, Python FastAPI hosting, and React hosting.

---

### Step A: Create Cloud PostgreSQL Database (on Render.com)

1. Go to **[Render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** ➔ **PostgreSQL**.
3. Fill in:
   - **Name**: `pizzazoon-db`
   - **Database**: `fooddel`
   - **User**: `postgres`
   - **Region**: Choose closest to you (e.g. *Singapore / Frankfurt*)
   - **Plan**: Free Tier
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL** (e.g., `postgresql://postgres:pass@dpg-xxx:5432/fooddel`).

---

### Step B: Deploy FastAPI Backend (on Render.com)

1. In Render Dashboard, click **New +** ➔ **Web Service**.
2. Select your connected GitHub repository.
3. Configure settings:
   - **Name**: `pizzazoon-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Scroll to **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | *(Paste the PostgreSQL Database URL from Step A)* |
| `SECRET_KEY` | `dev_secret_jwt_key_foodyzone_super_secure_923847923` |
| `ALGORITHM` | `HS256` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USERNAME` | `tiwarisneha581@gmail.com` |
| `SMTP_PASSWORD` | `hfluthuutpygaqlo` |
| `EMAIL_FROM` | `tiwarisneha581@gmail.com` |

5. Click **Create Web Service**.
6. When deployment finishes, copy your live backend URL:
   `https://pizzazoon-backend.onrender.com`

---

### Step C: Deploy React Frontend (on Vercel.com)

1. Go to **[Vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository.
4. Configure settings:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: Click *Edit* and select **`Food`**.
5. In **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `REACT_APP_API_BASE_URL` | `https://pizzazoon-backend.onrender.com/api/v1` |
| `REACT_APP_WS_BASE_URL` | `wss://pizzazoon-backend.onrender.com/ws` |

6. Click **Deploy**.
7. In ~60 seconds, your site is live with an SSL HTTPS domain (e.g., `https://pizzazoon.vercel.app`)!
