
# CatchAttack - Detection as Code Platform

> **Automated Adversary Emulation, Sigma Rule Generation, & One-Click SIEM Deployment**

This project provides an **end-to-end** "Detection as Code" approach, surpassing existing solutions by **automating adversary emulation** (aligned with [MITRE ATT&CK](https://attack.mitre.org/)), **generating Sigma rules**, checking for duplicates, and **deploying them to various SIEMs** through a robust **CI/CD pipeline** and an intuitive **dashboard**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Code Style: ESLint](https://img.shields.io/badge/Code%20Style-ESLint-blueviolet)](https://eslint.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue)](https://reactjs.org/)

---

## Table of Contents
1. [Overview](#overview)  
2. [Features](#features)  
3. [Technologies](#technologies)  
4. [Project Structure](#project-structure)  
5. [Installation & Setup](#installation--setup)  
6. [Usage](#usage)  
7. [Development](#development)
8. [Contributing](#contributing)  
9. [License](#license)

---

## Overview
**CatchAttack** is designed to help security teams:
- **Continuously test** their defenses with adversary emulations.
- **Automate** the generation of detection rules (Sigma).
- **Deploy** those detection rules to SIEM platforms (Elastic, Splunk, etc.) with **minimal manual effort**.
- Easily **integrate** with CI/CD processes for real-time updates and no-hassle deployments.

---

## Features
- **Adversary Emulation (MITRE ATT&CK)**  
  - One-click scenario generation.  
  - Scheduling and randomization for continuous testing.

- **Sigma Rule Generation**  
  - Automated creation of rules post-emulation.  
  - Duplicate checks to avoid overlapping or redundant detections.

- **SIEM Integration**  
  - One-click deployment to popular SIEMs (Elastic, Splunk).  
  - Real-time monitoring of deployment status and logs.

- **CI/CD Pipeline**  
  - Automates testing, rule generation, and deployment.  
  - Provides logs and error handling for visibility.

- **Dashboard & Management Interface**  
  - Real-time overview of adversary emulations and rule generation.  
  - Organized rule library with quick actions to deploy or manage rules.  
  - Role-based access control and audit logging.

---

## Technologies
- **Vite** – A fast and opinionated build tool with dev server support.  
- **TypeScript** – Strong typing for safer and more reliable code.  
- **React** – A powerful library for building component-based UIs.  
- **Tailwind CSS** – Utility-first CSS framework for rapid UI development.  
- **shadcn-ui** – A set of customizable React components built on Tailwind CSS.  
- **React Query** – Data fetching and state management.
- **Sigma** – Detection rule format.  
- **CI/CD Tools** – GitHub Actions, GitLab CI, or similar.

---

## Project Structure

```
catchattack/
├─ backend/                      # FastAPI backend service
├─ src/                          # Source code
│  ├─ components/                # Reusable UI components
│  │  ├─ detection/             # Detection-related components
│  │  ├─ emulation/             # Emulation-related components
│  │  ├─ layout/                # Layout components (sidebar, header, etc.)
│  │  ├─ mitre/                 # MITRE ATT&CK visualization components
│  │  ├─ rules/                 # Rule management components
│  │  ├─ siem/                  # SIEM integration components
│  │  ├─ sigma/                 # Sigma rule components
│  │  ├─ tenant/                # Tenant management components
│  │  ├─ ui/                    # Base UI components (buttons, cards, etc.)
│  │  └─ ...
│  ├─ config/                    # Configuration files
│  ├─ hooks/                     # Custom React hooks
│  ├─ lib/                       # Supporting utilities and libraries
│  ├─ pages/                     # Page components
│  ├─ services/                  # API clients and services
│  ├─ types/                     # TypeScript type definitions
│  └─ utils/                     # Utility functions
├─ public/                       # Static assets
├─ tests/                        # Tests
├─ .github/                      # GitHub configuration
│  └─ workflows/                 # GitHub Actions workflows
├─ .env.example                  # Example environment variables
└─ ...                           # Config files
```

---

## Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/valITino/catchattack-beta.git
   cd catchattack-beta
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and add your configuration.

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:3000

5. **Build for Production**
   ```bash
   npm run build
   ```

### Start Backend API

The Python backend is located in `backend/`. Install dependencies and set up the environment file:

```bash
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
# Edit `backend/.env` and add your configuration.
uvicorn backend.main:app --reload
```
Interactive docs are available at `http://localhost:8000/docs`.

> **Note:** The UI renders no data until the backend is running and reachable at `VITE_API_URL`. Mocks have been removed.

---

## Usage

### Dashboard

The dashboard provides a high-level overview of:
- Active emulations
- Detection rule coverage
- Recent activities
- SIEM integration status

### Adversary Emulation

1. Navigate to the Emulation page
2. Select techniques from the MITRE ATT&CK matrix or use the automated generator
3. Configure emulation parameters
4. Start the emulation and monitor results

### Rule Generation

1. After an emulation completes, navigate to the Rules page
2. Review automatically generated rules
3. Customize rules as needed
4. Save to your rule library

### SIEM Deployment

1. Navigate to the SIEM Integration page
2. Connect your SIEM platforms
3. Select rules to deploy
4. Monitor deployment status

---

## Development

### Code Style

We use ESLint and Prettier for code style. Run the linter:

```bash
npm run lint
```

### Testing

Run the test suite:

```bash
npm test
```

### Creating New Components

1. Create a new file in the appropriate subdirectory under `src/components/`
2. Follow the existing component patterns
3. Export your component
4. Import and use it in your pages or other components

---

## Contributing
We welcome contributions from the community. To contribute:

1. Fork the repository and create a new branch for your feature or bugfix.
2. Commit your changes with clear and descriptive messages.
3. Ensure your code follows our style guidelines and passes all tests.
4. Open a Pull Request to the main branch, describing what you've changed and why.

Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License
This project is distributed under the MIT License. You're free to use, modify, and distribute it in accordance with the license terms.
