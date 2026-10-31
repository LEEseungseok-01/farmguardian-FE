import { Navigate, Route, Routes } from 'react-router-dom'
import { Toast } from './components/Toast'
import Dashboard from './screens/Dashboard'
import DrugList from './screens/DrugList'
import Fields from './screens/Fields'
import History from './screens/History'
import Login from './screens/Login'
import MapHome from './screens/MapHome'
import PestSelect from './screens/PestSelect'
import ScanSheet from './screens/ScanSheet'
import Verdict from './screens/Verdict'
import { AppProvider } from './state/AppState'

export default function App() {
  return (
    <AppProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/map" element={<MapHome />}>
            <Route path="scan" element={<ScanSheet />} />
          </Route>
          <Route path="/pests" element={<PestSelect />} />
          <Route path="/drugs" element={<DrugList />} />
          <Route path="/verdict/:drugId" element={<Verdict />} />
          <Route path="/history" element={<History />} />
          <Route path="/fields" element={<Fields />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toast />
      </div>
    </AppProvider>
  )
}
