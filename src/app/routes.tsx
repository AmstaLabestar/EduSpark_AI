import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import CoursePage from "./pages/CoursePage";
import ChatTutor from "./pages/ChatTutor";
import Exercises from "./pages/Exercises";
import CreateCourse from "./pages/CreateCourse";
import AppEntry from "./pages/AppEntry";
import { ProtectedRoute } from "./auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/app",
    element: <AppEntry />,
  },
  {
    path: "/student-dashboard",
    element: (
      <ProtectedRoute role="student">
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher-dashboard",
    element: (
      <ProtectedRoute role="teacher">
        <TeacherDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/course/:courseId",
    element: (
      <ProtectedRoute>
        <CoursePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/chat/:courseId",
    element: (
      <ProtectedRoute>
        <ChatTutor />
      </ProtectedRoute>
    ),
  },
  {
    path: "/exercises/:courseId",
    element: (
      <ProtectedRoute>
        <Exercises />
      </ProtectedRoute>
    ),
  },
  {
    path: "/create-course",
    element: (
      <ProtectedRoute role="teacher">
        <CreateCourse />
      </ProtectedRoute>
    ),
  },
]);
