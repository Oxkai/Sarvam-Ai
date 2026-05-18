import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './features/home/HomePage';
import InferencePage from './features/inference/InferencePage';
import DiffPage from './features/diff/DiffPage';
import NotFoundPage from './features/NotFoundPage';
import Playground from './clones/pages/Playground';
import TranslatePage from './clones/pages/TranslatePage';
import VisionPage from './clones/pages/VisionPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Assignment routes (canonical) */}
        <Route path="/inference" element={<InferencePage />} />
        <Route path="/diff" element={<DiffPage />} />

        {/* Aliases for the same components — kept for the assignment submission URLs */}
        <Route path="/task1" element={<InferencePage />} />
        <Route path="/task2" element={<DiffPage />} />

        {/* Clone routes — visual references to the Sarvam dashboard, not part of the assignment */}
        <Route path="/playground" element={<Playground />} />
        <Route path="/translate" element={<TranslatePage />} />
        <Route path="/vision" element={<VisionPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
