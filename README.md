# Knowledge Management System for Engineering Education

## Using Docker Compose to Run the Application

This project uses **Docker Compose** to set up both the frontend and backend services. The following steps will guide you through the process of running the entire application with a single command.

### Prerequisites

- Docker and Docker Compose must be installed on your machine.
- Ensure that your project code is in the correct directory before proceeding.

### Run the Application Using Docker Compose

1. **Build and start the frontend and backend containers**:

   From the project root directory (where `docker-compose.yml` is located), run:

   ```bash
   docker-compose up --build
   ```

   This will automatically build both the frontend and backend Docker images, and start the services in the background.

2. **Run the containers in detached mode** (if you prefer to run in the background):

   ```bash
   docker-compose up --build -d
   ```

### Accessing the Application

- **Frontend**: Once the containers are running, you can access the frontend at [http://localhost:5173](http://localhost:5173).
- **Backend**: The backend will be available at [http://localhost:8080](http://localhost:8080).

### Reloading Dependencies

If you make changes to the dependencies, you'll need to rebuild the Docker images and restart the containers to reflect the changes.

1. **Reload frontend dependencies**:

   To reload the frontend dependencies, run:

   ```bash
   docker-compose up --build frontend
   ```

   This will rebuild the frontend service and install any new dependencies.

2. **Reload backend dependencies**:

   Similarly, to reload the backend dependencies, run:

   ```bash
   docker-compose up --build backend
   ```

3. **Rebuild both frontend and backend**:

   If you want to rebuild both frontend and backend dependencies, run:

   ```bash
   docker-compose up --build
   ```

   This will rebuild both services and install the updated dependencies.

### Stopping the Containers

To stop the containers, run the following command from the project root directory:

```bash
docker-compose down
```

---

With this setup, Docker Compose will manage both your frontend and backend containers, simplifying the process of building, running, and stopping the application. The reload section ensures that any changes to the dependencies are properly reflected without needing to manually rebuild each container.
