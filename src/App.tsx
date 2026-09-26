import { useEffect } from 'react'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { LearningMapPage } from '@/features/map/LearningMapPage'
import { ModulePage } from '@/features/units/ModulePage'
import { UnitPage } from '@/features/units/UnitPage'
import { QuizPage } from '@/features/quiz/QuizPage'
import { ResultPage } from '@/features/quiz/ResultPage'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { CertificatePage } from '@/features/certificate/CertificatePage'
import { useProgressStore } from '@/stores/progressStore'


/** Remount QuizPage when unitId or mode changes (extra safety vs leftover store). */
function QuizPageRoute() {
  const { unitId = '' } = useParams()
  const [params] = useSearchParams()
  const mode = params.get('mode') ?? 'full'
  return <QuizPage key={`${unitId}-${mode}`} />
}

export default function App() {
  const hydrate = useProgressStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <BrowserRouter basename="/agent-quiz">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LearningMapPage />} />
          <Route path="modules/:moduleId" element={<ModulePage />} />
          <Route path="units/:unitId" element={<UnitPage />} />
          <Route path="units/:unitId/quiz" element={<QuizPageRoute />} />
          <Route path="units/:unitId/result" element={<ResultPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="certificate/:moduleId" element={<CertificatePage />} />
          <Route
            path="*"
            element={
              <div className="py-20 text-center">
                <p className="text-5xl mb-3">🧭</p>
                <p className="text-xl font-bold">這裡沒有寶藏…</p>
                <p className="text-muted-foreground mt-2">路徑不存在，回學習地圖吧。</p>
                <Link to="/" className="mt-4 inline-block text-violet-300 underline">
                  回首頁
                </Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
