# Project Setup Guide

This guide will help you set up the Aivestire project on a new computer. The project consists of a Backend (NestJS), a Database (PostgreSQL), and a Frontend (React).

## Prerequisites

Before you begin, make sure you have the following installed on your computer:

1.  **Git**: [Download Git](https://git-scm.com/downloads)
2.  **Docker Desktop**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) (Make sure it is running)
3.  **Node.js (LTS version)**: [Download Node.js](https://nodejs.org/)
4.  **pgAdmin 4** (Optional, for viewing the database): [Download pgAdmin](https://www.pgadmin.org/download/)

---

## Step 1: Clone the Repository

Open your terminal (Command Prompt or PowerShell) and run the following command to download the project:

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd <YOUR_PROJECT_FOLDER_NAME>
```

_(Replace `<YOUR_GITHUB_REPO_URL>` with the actual link to your GitHub repository)_

---

## Step 2: Setup Backend & Database (Docker)

The backend and database are set up to run inside Docker containers.

1.  **Navigate to the backend folder:**

    ```bash
    cd aivestire-backend-tmp
    ```

2.  **Create the Environment File:**
    Create a new file named `.env` in the `aivestire-backend-tmp` folder.
    Open it with a text editor (like Notepad) and paste the following content:

    ```env
    # Database Connection
    DATABASE_URL="postgresql://postgres:postgres@db:5432/aivestire"

    # Security (You can change this to a secure random string)
    JWT_SECRET="dev-secret"

    # Port
    PORT=3000
    ```

3.  **Start the Services:**
    Go back to the main project folder (where `docker-compose.yaml` is located) and run:

    ```bash
    cd ..
    docker-compose up --build -d
    ```

    - This command downloads the necessary images and starts the database and backend.
    - The backend will be available at: `http://localhost:3002`

---

## Step 3: Initialize Database & Create Tables (Prisma)

Once the Docker containers are running, you need to set up the database tables. We will run these commands _inside_ the Docker container to make it easy.

1.  **Open your terminal** (ensure you are in the project root folder).

2.  **Generate Prisma Client:**
    This prepares the code to talk to the database.

    ```bash
    docker exec -it nest-server npx prisma generate
    ```

3.  **Create Tables (Push Schema):**
    This creates the tables in the database based on your schema.

    ```bash
    docker exec -it nest-server npx prisma db push
    ```

    - You should see a message saying "The database is now in sync with your Prisma schema."

---

## Step 4: Setup Frontend

The frontend runs locally on your machine.

1.  **Navigate to the frontend folder:**

    ```bash
    cd frontend
    ```

2.  **Create the Environment File:**
    Create a new file named `.env` in the `frontend` folder.
    Paste the following content:

    ```env
    # Point this to the backend URL
    VITE_API_URL=http://localhost:3002
    ```

3.  **Install Dependencies:**
    Run the following command to install the required libraries:

    ```bash
    npm install
    ```

4.  **Start the Frontend:**
    Run the application:

    ```bash
    npm run dev
    ```

    - You should see a URL in the terminal, usually `http://localhost:5173`.
    - Open that URL in your browser to use the application.

---

## Step 5: Setup pgAdmin (To View Database)

If you want to see the data inside your database, follow these steps:

1.  **Open pgAdmin 4** on your computer.
2.  Right-click on **Servers** in the left sidebar > **Register** > **Server...**
3.  **General Tab**:
    - **Name**: Aivestire Local (or any name you like)
4.  **Connection Tab**:
    - **Host name/address**: `localhost`
    - **Port**: `5538`
    - **Maintenance database**: `postgres`
    - **Username**: `postgres`
    - **Password**: `postgres`
5.  Click **Save**.
6.  Expand the new server in the sidebar: **Databases** > **aivestire** > **Schemas** > **public** > **Tables**.
    - You should see all your tables (User, Product, etc.) here.

---

## Troubleshooting

- **Docker errors**: Ensure Docker Desktop is running.
- **Database connection error**: Make sure the `DATABASE_URL` in `aivestire-backend-tmp/.env` matches exactly what is shown above.
- **"Prisma Client not initialized"**: Run the `npx prisma generate` command from Step 3 again.
- **Frontend cannot connect**: Check if the backend is running by visiting `http://localhost:3002` in your browser. You should see a "Hello World" or 404 message, confirming it's active.
