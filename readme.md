1. **Run the Backend**:
    Before running the backend, create a `.env` file in the `backend` directory with the following content:
    ```
    PORT=8000
    JWT_SECRET=R+cB7pjcLNfd/tQ8K/EjGLnUT2f4Odvm+v9ppb6q+Ro=
    MONGO_DB_URI=mongodb+srv://amanadhikari2003:<password>@cluster1.umedx6t.mongodb.net/WebRTC?retryWrites=true&w=majority&appName=Cluster1
    NODE_ENV=production
    ```

    Then, execute the following commands:
    ```bash
    cd backend
    npm install
    npm run dev
    ```

2. **Run the Frontend**:
    ```bash
    cd frontend
    npm install
    npm run electron:dev
    ```

3. Open your browser and navigate to the specified URL (usually `http://localhost:3000` for the frontend).