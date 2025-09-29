import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import UMLRelationshipsDemo from "./components/UMLRelationshipsDemo";

createRoot(document.getElementById("root")!).render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/demo" element={<UMLRelationshipsDemo />} />
    </Routes>
  </Router>
);
