import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import UMLRelationshipsDemo from "./components/UMLRelationshipsDemo";
import Demo2 from "./components/Demo2";

createRoot(document.getElementById("root")!).render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/demo" element={<UMLRelationshipsDemo />} />
      <Route path="/demo2" element={<Demo2 />} />
    </Routes>
  </Router>
);
