import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Playground from './pages/Playground';
import TranslatePage from './pages/TranslatePage';
import VisionPage from './pages/VisionPage';
import DiffPage from './pages/DiffPage';
import InferencePage from './pages/InferencePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/task1" element={<InferencePage />} />
        <Route path="/task2" element={<DiffPage />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/inference" element={<InferencePage />} />
        <Route path="/translate" element={<TranslatePage />} />
        <Route path="/vision" element={<VisionPage />} />
        <Route path="/diff" element={<DiffPage />} />
      </Routes>
    </BrowserRouter>
  );
}
