import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ToastProvider } from './context/ToastContext'
import { AddCourse } from './views/AddCourse'
import { About } from './views/About'
import { Browse } from './views/Browse'
import { CourseList } from './views/CourseList'
import { CoursePage } from './views/CoursePage'
import { EmbedView } from './views/EmbedView'
import { ReportPage } from './views/ReportPage'
import { Submit } from './views/Submit'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Browse />} />
            <Route path="submit" element={<Submit />} />
            <Route path="about" element={<About />} />
            <Route path="courses" element={<CourseList />} />
            <Route path="add-course" element={<AddCourse />} />
            <Route path="course/:courseSlug" element={<CoursePage />} />
          </Route>
          <Route
            path="course/:courseSlug/:reportSlug"
            element={<ReportPage />}
          />
          <Route path="embed/:courseId" element={<EmbedView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
