---
description: How to deploy the Node.js backend to NestNepal (cPanel) using GitHub
---

# Deploying Backend to NestNepal (cPanel)

This guide walks you through deploying your Node.js backend to NestNepal's shared hosting using the "Setup Node.js App" feature and GitHub.

## Prerequisites
1.  **Direct GitHub Access**: Your project must be pushed to a GitHub repository.
2.  **NestNepal cPanel Access**: You must have login credentials for your cPanel.

## Step 1: Push Code to GitHub
Ensure your latest code is on GitHub.
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 2: Configure Node.js App in cPanel
1.  Log in to **cPanel**.
2.  Search for **"Setup Node.js App"** under the *Software* section.
3.  Click **Create Application**.
4.  **Configuration:**
    *   **Node.js Version**: Select **18.x** or **20.x** (Match your local version if possible).
    *   **Application Mode**: Select **Production**.
    *   **Application Root**: Enter `backend` (or `bivanhandicraft-backend`). This is the folder name where files will live.
    *   **Application URL**: Select your subdomain **`svc.nevanhandicraft.com.np`** from the dropdown.
    *   **Application Startup File**: Enter `server.js`.
5.  Click **Create**.

## Step 3: Get the Code on the Server
You have two options: **Git Clone (Recommended)** or **Manual Upload**.

### Option A: Using Git (Recommended)
1.  In cPanel, go to **Git™ Version Control**.
2.  Click **Create**.
3.  **Clone URL**: Paste your GitHub Repository URL (HTTPS).
4.  **Repository Path**: Enter the SAME path you used in "Application Root" (e.g., `backend`).
    *   *Note: If cPanel complains the directory exists, you might need to delete the empty folder created in Step 2 first using File Manager.*
5.  Click **Create**.

### Option B: Manual Upload (If Git fails)
1.  Zip your local `backend` folder (exclude `node_modules`).
2.  In cPanel **File Manager**, go to the "Application Root" folder (`backend` inside `svc.nevanhandicraft.com.np`'s root, usually).
3.  Upload and Extract the Zip.

## Step 4: Install Dependencies
1.  Go back to **Setup Node.js App**.
2.  Click the **Edit** (Pencil) icon for your app.
3.  Click the **Run NPM Install** button.
    *   *This will read your `package.json` and install libraries.*

## Step 5: Configure Environment Variables (.env)
1.  In the "Setup Node.js App" detail page, look for **Environment Variables**.
2.  Click **Add Variable**.
3.  Add all variables from your local `.env`:
    *   `PORT`: `3000` (or leave empty, cPanel handles this)
    *   `MONGODB_URI`: `mongodb+srv://...` (Your Production DB URL)
    *   `JWT_SECRET`: (Your Secret)
    *   `CLOUDINARY_CLOUD_NAME`: ...
    *   `CLOUDINARY_API_KEY`: ...
    *   `CLOUDINARY_API_SECRET`: ...
    *   `ESEWA_MERCHANT_ID`: ...
    *   `KHALTI_SECRET_KEY`: ...
    *   `FRONTEND_URL`: **IMPORTANT:** Add your Vercel URL (e.g., `https://nevanhandicraft.com.np` and `https://your-vercel-app.vercel.app`) to allow CORS. If multiple, comma-separate them if your code supports it, or just use the main one.
4.  Click **Save**.

## Step 6: Start the Server
1.  In "Setup Node.js App", click **Restart Application**.
2.  Visit **`https://svc.nevanhandicraft.com.np`** to verify it's running (It might show "Cannot GET /" which is fine for an API).

## Troubleshooting
*   **Error 500 / 503**: Check the **stderr.log** file in your Application Root folder via File Manager.
*   **"App updated but changes not showing"**: You MUST click **Restart Application** in cPanel after every code change.
