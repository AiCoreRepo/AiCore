# 🚀 Deployment Guide: Render + GitHub

You have two options to deploy. **Option 1 is the easiest** and recommended if you just want it to work automatically.

## Option 1: Simple Auto-Deploy (Recommended)
**No GitHub Actions needed.** Render simply watches your `main` branch.

### How it works:
1.  You work on `dev`.
2.  When you merge `dev` -> `main`, Render sees the change and automatically deploys.

### Setup Steps:
1.  **Push Code**: Ensure `render.yaml` is in your `main` branch.
2.  **Go to Render**: Log in to [Render.com](https://render.com).
3.  **Create Blueprint**: Click **New +** -> **Blueprint**.
4.  **Connect Repo**: Select your GitHub repository.
5.  **Select Branch**: Make sure to select `main`.
6.  **Apply**: Click **Apply**. Render reads `render.yaml` and deploys everything.

**That's it!** Now, every time you update `main`, Render deploys automatically.

---

## Option 2: Advanced Control (GitHub Actions)
Use this ONLY if you want to run tests *before* deploying, or want manual control.

### How it works:
1.  GitHub Actions runs tests when you push to `main`.
2.  If tests pass, it tells Render to deploy.

### Setup Steps:
1.  **Disable Auto-Deploy**: In Render Dashboard -> Settings -> **Auto-Deploy: No**.
2.  **Get Deploy Hook**: In Render Settings, copy the **Deploy Hook URL**.
3.  **Add Secret**: Go to GitHub Repo -> Settings -> Secrets -> New Secret.
    -   Name: `RENDER_DEPLOY_HOOK`
    -   Value: (Paste the URL)
4.  **Workflow**: The `.github/workflows/render-deploy.yml` file I created handles the rest.
