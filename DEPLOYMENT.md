# Render Deployment Guide for Placement Readiness Analyzer

This project is configured with a Render Blueprint file (`render.yaml`) for one-click deployment of both the Backend Express Server and Frontend React App on Render.com.

---

## Deployment Steps on Render.com

### Option 1: Automatic Blueprint Deployment (Recommended)

1. Push this project repository to **GitHub** or **GitLab**.
2. Log into your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect [`render.yaml`](file:///c:/Users/Asus/OneDrive/Desktop/fdplacement%20analyzer%20project/render.yaml) and configure two services:
   - **`placement-readiness-backend`** (Node.js Express API)
   - **`placement-readiness-frontend`** (React + Vite Web App)
6. Under `placement-readiness-backend` Environment Variables, enter your **MongoDB Atlas URI** for `MONGODB_URI`.
7. Click **Apply**. Render will automatically build and deploy both services!

---

## Service Configuration Details

### 1. Backend Service (`Placement-Readinessb`)
- **Root Directory**: `Placement-Readinessb`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Required Environment Variables**:
  - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/placement_readiness`
  - `PORT`: `5000`
  - `JWT_SECRET`: `your_secure_jwt_secret`

### 2. Frontend Service (`placement`)
- **Root Directory**: `placement`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/server.cjs`
- **Required Environment Variables**:
  - `VITE_API_URL`: `https://placement-readiness-backend.onrender.com/api` (Render automatically wires this via `render.yaml`)

---

## Local Verification
Before deploying, you can test building locally:
```bash
npm run build
```
And to start the dev environment:
```bash
npm run dev
```
