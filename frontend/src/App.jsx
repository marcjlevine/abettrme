import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Progress from "./pages/Progress";
import Activities from "./pages/Activities";
import Rewards from "./pages/Rewards";
import Log from "./pages/Log";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Routes>
          <Route path="/" element={<Navigate to="/progress" replace />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/log" element={<Log />} />
        </Routes>
      </main>
    </div>
  );
}
