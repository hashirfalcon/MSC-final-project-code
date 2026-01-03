# Visual Rule Weaver 🧵

A powerful visual rule builder with **automatic system monitoring** and real-time alerts!

## 🚨 NEW: Automatic System Monitoring

Create rules that automatically monitor your PC's system metrics and trigger alerts with:
- 🔊 **Audio alarms** - Beep sounds when conditions are met
- 🗣️ **Voice alerts** - Text-to-speech announcements
- 🚨 **Visual warnings** - Full-screen flashing alerts
- 📬 **Browser notifications** - Desktop notifications

**Monitored Metrics:** Memory usage, CPU, battery level, time, storage, network status, and more!

👉 [**Read the Full Guide**](./AUTOMATIC_MONITORING_GUIDE.md) to get started with automatic monitoring!

## ✨ Features

### Visual Rule Editor
- **Drag-and-drop interface** - Build rules visually with nodes and connections
- **Condition nodes** - Define when rules should trigger
- **Action nodes** - Specify what should happen
- **Operator nodes** - Combine conditions with AND/OR logic
- **Natural language preview** - See your rules in plain English

### Automatic Monitoring
- **Real-time system metrics** - Auto-fetch CPU, memory, battery, and more
- **Continuous monitoring** - Checks every 2 seconds
- **Multi-modal alerts** - Sound, voice, visual, and notifications
- **Custom conditions** - Create rules for any metric

### Rule Management
- **Save & edit rules** - Store rules in Firebase
- **Export rules** - Download as JSON
- **Rule validation** - Ensure rules are properly structured
- **Test mode** - Try rules with manual or automatic inputs

### Authentication
- **Firebase Auth** - Secure user accounts
- **Protected routes** - Keep your rules private
- **User profiles** - Manage your account

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Create your first monitoring rule:**
   - Go to the **Saved Rules** page
   - Click "**Create Example Rule**" to get started
   - Click the eye icon to preview and enable monitoring

## 📖 Documentation

- [Automatic Monitoring Guide](./AUTOMATIC_MONITORING_GUIDE.md) - Complete guide to system monitoring
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Technical implementation details
- [Firestore Auth Guide](./FIRESTORE_AUTH_GUIDE.md) - Authentication setup

## Project info

This repository does not include references to external editor services.

## How can I edit this code?

There are several ways of editing your application locally or in your preferred cloud IDE.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

