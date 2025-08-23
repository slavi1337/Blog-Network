# Blog-Network Platform

Welcome to the Blog-Network Platform! This is a full-stack web application built with a modern technology stack, featuring a React frontend and a Node.js/Express backend.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)

## Features

- User authentication and authorization with Clerk.
- Rich text editor for creating and managing blog posts.
- Post scheduling, drafts, and publishing workflows.
- User profiles, following system, and post interaction (likes, comments).
- "For You" feed based on user interests and followed authors.
- Admin dashboard for managing users, reported issues, and site content.
- Image and media uploads handled by ImageKit.
- ...

## Tech Stack

**Frontend:**
- **Framework:** React (with Vite)
- **Styling:** Tailwind CSS
- **Authentication:** Clerk

**Backend:**
- **Framework:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** Clerk
- **Media Management:** ImageKit

## Project Structure

This project is a monorepo containing two main packages:

-   `backend/`: The Node.js/Express API server.
-   `frontend/`: The React client application.

Each package has its own dependencies and scripts, managed by its respective `package.json` file.

## Getting Started

Follow these instructions to set up the project on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18.x or later recommended)
-   [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
-   A running PostgreSQL database instance.
-   API keys for Clerk and ImageKit.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/slavi1337/Blog-Network.git
    cd Blog-Network
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```

## Running the Application

To run the application, you will need to start both the backend server and the frontend development server in **two separate terminal windows**.

1.  **Start the Backend Server:**
    -   Navigate to the `backend` directory.
    -   Make sure your `.env` file is configured (see [Environment Variables](#environment-variables)).
    -   Run the server:
        ```bash
        cd backend
        npm start 
        # Or if you use nodemon for development:
        # nodemon server.js
        ```
    -   The backend will be running on `http://localhost:3000`.

2.  **Start the Frontend Development Server:**
    -   Navigate to the `frontend` directory.
    -   Make sure your `.env` file is configured.
    -   Run the development server:
        ```bash
        cd frontend
        npm run dev
        ```
    -   The application will be accessible in your browser at `http://localhost:5173`.

## Environment Variables

This project uses environment variables for configuration. You will need to create `.env` files in both the `backend` and `frontend` directories.

-   **Backend:**
    -   In the `backend/` folder, create a `.env` file.
    -   You can copy the example file: `cp .env.example .env`
    -   Fill in the required variables:
        ```env
        DATABASE_URL=postgresql://user:password@host:port/database
        CLERK_SECRET_KEY=your_clerk_secret_key
        # ... other backend variables ...
        ```

-   **Frontend:**
    -   In the `frontend/` folder, create a `.env` file.
    -   You can copy the example file: `cp .env.example .env`
    -   Fill in the required variables (prefixed with `VITE_`):
        ```env
        VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
        VITE_IK_PUBLIC_KEY=your_imagekit_public_key
        # ... other frontend variables ...
        ```
