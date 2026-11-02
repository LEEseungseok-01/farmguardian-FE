import type { ReactNode } from 'react'
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
import Settings from './screens/Settings'
import Verdict from './screens/Verdict'
import ZoneSetup from './screens/ZoneSetup'
import { AppProvider, useApp } from './state/AppState'

/** 로그인한 사람은 밭과 구역을 받아 와야 화면을 보여 준다. 구역이 없으면 나누는 화면이 먼저다 */
function Gate({ children }: { children: ReactNode }) {
  const { user, ready, loadError, reload, signOut, unzoned } = useApp()
  if (!user) return children
  if (!ready) {
    return (
      <div className="page">
        <div className="page__body empty">
          <p>{loadError || '내 밭을 불러오는 중이에요'}</p>
          {loadError && (
            <>
              <button type="button" className="btn btn--primary" onClick={reload}>
                다시 시도
              </button>
              <button type="button" className="btn btn--ghost" onClick={signOut}>
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    )
  }
  return unzoned ? <ZoneSetup farm={unzoned} /> : children
}

export default function App() {
  return (
    <AppProvider>
      <div className="app-shell">
        <Gate>
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
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Gate>
        <Toast />
      </div>
    </AppProvider>
  )
}
