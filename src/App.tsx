import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Contact } from "./pages/Contact";
import { Experiences } from "./pages/Experiences";
import { Home } from "./pages/Home";
import { LeadSelf } from "./pages/LeadSelf";
import { Live } from "./pages/Live";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Projects } from "./pages/Projects";
import { Resume } from "./pages/Resume";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="experiences" element={<Experiences />} />
        <Route path="lead-self" element={<LeadSelf />} />
        <Route path="resume" element={<Resume />} />
        <Route path="systems" element={<Live />} />
        <Route path="live" element={<Navigate to="/systems" replace />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
