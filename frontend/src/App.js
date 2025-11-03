import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Images from './pages/Images';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Volumes from './pages/Volumes';
import Networks from './pages/Networks';
import SystemInfo from './pages/SystemInfo';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Templates from './pages/Templates';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './context/ThemeContext';
import CommandPalette from './components/CommandPalette';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <Toaster position="top-right" />
        <BrowserRouter>
          <CommandPalette />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/images" element={<Images />} />
            <Route path="/volumes" element={<Volumes />} />
            <Route path="/networks" element={<Networks />} />
            <Route path="/system" element={<SystemInfo />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
