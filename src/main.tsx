import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UMLRelationshipsDemo from "./components/UMLRelationshipsDemo";
import Demo2 from "./components/Demo2";

createRoot(document.getElementById("root")!).render(
  <Router>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/diagrams" element={<App />} />
      <Route path="/diagrams/:id" element={<App />} />
      <Route path="/demo" element={<UMLRelationshipsDemo />} />
      <Route path="/demo2" element={<Demo2 />} />
    </Routes>
  </Router>
);
