import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CreateSurvey from "./pages/CreateSurvey";
import RunSurvey from "./pages/RunSurvey";
import Results from "./pages/Results";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/create" element={<Layout><CreateSurvey /></Layout>} />
        <Route path="/run/:id" element={<Layout><RunSurvey /></Layout>} />
        <Route path="/results/:id" element={<Layout><Results /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
