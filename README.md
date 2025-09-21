# KnowmIA

An intuitive platform designed to streamline educational content management and collaborative learning experiences.

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-None-lightgrey) ![Stars](https://img.shields.io/github/stars/sophie-mc-dev/kms-for-education?style=social) ![Forks](https://img.shields.io/github/forks/sophie-mc-dev/kms-for-education?style=social)

![Project Preview Image](/preview_example.png)

## ✨ Features
- Semantic search over educational resources
- Personalized learning paths
- Knowledge graph–based recommendations
- User and resource management

## 🛠️ Tech Stack
- **Backend:** [Node.js](https://nodejs.org/)  
- **Frontend:** [React](https://react.dev/)  
- **Databases:**  
  - PostgreSQL
  - Neo4j
  - Elasticsearch
- **Storage:** Cloudflare R2
- **Containerization:** Docker & Docker Compose (optional, project not fully configured to run with Compose)  

## 🔧 Prerequisites

Before starting, make sure you have the following installed on your system:

- [Git](https://git-scm.com/) – for cloning and version control  
- [Node.js](https://nodejs.org/) & [npm](https://www.npmjs.com/) – for running backend and frontend  
- [Docker Desktop](https://www.docker.com/products/docker-desktop) – includes Docker Engine & Docker Compose  
- [PostgreSQL](https://www.postgresql.org/) (with optional [pgAdmin](https://www.pgadmin.org/) for management)  
- [Neo4j](https://neo4j.com/download/) – Desktop or Docker (⚠️ APOC plugin required)  
- [Elasticsearch](https://www.elastic.co/elasticsearch/) – easiest via Docker  
- [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/) – ⚠️ **currently disabled**; must be reconfigured or replaced by the next maintainer  


## ⚙️ Environment Setup

Follow these steps to get `kms-for-education` up and running on your local machine.

1.  **Clone the Repository**

    First, clone the `kms-for-education` repository to your local machine:

    ```bash
    git clone https://github.com/sophie-mc-dev/kms-for-education.git
    cd kms-for-education
    ```

2.  **Create the Databases**

      - **Postgres**: 
         - Create a local database and add the connection string to .env. 
         - A `.sql` file is stored in the `/backend/utils` folder with the structure from the PostgreSQL database.

      - **Neo4j**:
         - Either run locally and enable the APOC plugin, OR
         - Run with Docker (requires plugin configuration).

      - **Elasticsearch**
         - Create Docker container:

         ```
         docker run -d \
         --name elasticsearch \
         -e "discovery.type=single-node" \
         -p 9200:9200 \
         docker.elastic.co/elasticsearch/elasticsearch:8.10.2
         ```

3.  **Configure the Repository**

      The project uses a `.env` file for configuration.  
      Each developer should create their own `.env` file in the `backend/` directory.

      Key variables include:
      - `POSTGRES_HOST=...`
      - `NEO4J_URI=...`
      - `R2_ACCESS_KEY_ID=...` (⚠️ R2 disabled, update or replace)

      ⚠️ **Important:**  
      With the correct `.env` variables, the backend will automatically connect to the databases. The database configuration files are stored in the `/backend/scripts` folder.

4.  **Run frontend and backend services**

      To run the frontend and backend services independently for development purposes run the following commands:

      #### Frontend Setup

      ```bash
      # From the project root
      cd frontend
      npm install 
      npm run dev
      ```

      #### Backend Setup

      ```bash
      # From the project root
      cd backend
      npm install 
      npm run dev
      ```


## 🚀 Usage
Once the application is running, open the platform in your browser.
You can create different users (student and educator) to view distinct role-based screens and functionalities.

---

*Copyright © 2025 sophie-mc-dev. All rights reserved.*