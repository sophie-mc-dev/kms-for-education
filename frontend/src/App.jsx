import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth, HomePage } from "@/layouts";
import { UserProvider } from "@/context/UserContext";

function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/homepage/*" element={<HomePage />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/auth/*" element={<Auth />} />
        <Route path="*" element={<Navigate to="/homepage" replace />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
