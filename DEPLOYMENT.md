# The Sampling Lab — Deployment Guide

The Sampling Lab is configured for **unified single-service deployment**: the FastAPI backend serves both the API endpoints (`/api/...`) and the pre-built React frontend from `frontend/dist/` on a single port.

---

## 1. Instant Free Cloud Deployment (Render.com)

Render provides free or low-cost cloud web services with automatic HTTPS and Docker support.

### Steps:
1. **Push your code to GitHub**:
   ```bash
   git remote add origin https://github.com/<your-username>/SamplingLab.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
3. Connect your GitHub repository `SamplingLab`.
4. Render will automatically detect [`render.yaml`](file:///c:/Users/shaik/OneDrive/Desktop/SamplingLab/render.yaml) or choose:
   - **Environment:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Region:** Oregon (US West) or closest to you
5. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: *(Your Groq API key)*
   - `GEMINI_API_KEY`: *(Your Google Gemini API key)*
6. Click **Deploy Web Service**.
7. Your app will be live at `https://sampling-lab-xxxx.onrender.com`!

---

## 2. One-Click Cloud Deployment (Railway.app)

Railway provides instant Docker/Python hosting with zero configuration.

### Steps:
1. Go to [Railway.app](https://railway.app/) and log in with GitHub.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select `SamplingLab`.
4. Go to **Variables** in the Railway service settings and add:
   - `PORT`: `8000`
   - `GROQ_API_KEY`: *(Your key)*
   - `GEMINI_API_KEY`: *(Your key)*
5. Click **Generate Domain** under **Networking**.
6. Railway builds and deploys your unified container.

---

## 3. Free ML Cloud Hosting (Hugging Face Spaces)

Hugging Face Spaces offers generous free RAM (16 GB) for running PyTorch models like `distilgpt2` without resource limits.

### Steps:
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) > **Create New Space**.
2. Select **Docker** as the Space SDK (Blank).
3. Clone your Space repo locally and push this codebase:
   ```bash
   git remote add space https://huggingface.co/spaces/<your-username>/sampling-lab
   git push space main
   ```
4. In your Space **Settings** > **Variables and Secrets**, add your `GROQ_API_KEY` and `GEMINI_API_KEY`.
5. Hugging Face builds your Docker container and presents the live interactive app.

---

## 4. Local Network / Production Mode

You can run the unified production server locally or make it accessible to anyone on your local Wi-Fi / LAN network.

### Quick Start:
Double-click [`start_production.bat`](file:///c:/Users/shaik/OneDrive/Desktop/SamplingLab/start_production.bat) or run:
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

- **Local Machine:** [http://localhost:8000](http://localhost:8000)
- **Local Network / Mobile Devices:** `http://<your-computer-ip>:8000`

---

## 5. Docker Container (Run Anywhere)

Build and run with standard Docker:
```bash
docker build -t samplinglab .
docker run -d -p 8000:8000 --env-file .env samplinglab
```
Or with docker-compose:
```bash
docker compose up -d
```
Visit [http://localhost:8000](http://localhost:8000).
