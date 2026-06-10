import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { useEffect, useState } from "react";

// firebase
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase/firebase";

// library
import { Toaster } from "react-hot-toast";

// layouts
import Main, { mainLoader } from "./layouts/Main";

// actions
import { logoutAction } from "./actions/logout";

import { deleteBudget } from "./actions/deleteBudget";

// pages
import Dashboard, { dashboardAction, dashboardLoader } from "./pages/Dashboard";

import ReauthenticatePage from "./pages/ReauthenticatePage";

import Error from "./pages/Error";

import ExpensesPage, {
  expensesAction,
  expensesLoader,
} from "./pages/ExpensesPage";

import BudgetPage, { budgetAction, budgetLoader } from "./pages/BudgetPage";

// auth pages
import Login from "./pages/Login";

import Intro from "./components/Intro";

// protected route
import ProtectedRoute from "./components/ProtectedRoute";

// router
const router = createBrowserRouter([
  {
    path: "/",

    element: <Main />,

    loader: mainLoader,

    errorElement: <Error />,

    children: [
      // LOGIN PAGE
      {
        index: true,

        element: <Login />,
      },

      // SIGNUP PAGE
      {
        path: "signup",

        element: <Intro />,
      },

      // DASHBOARD
      {
        path: "dashboard",

        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),

        loader: dashboardLoader,

        action: dashboardAction,

        errorElement: <Error />,
      },

      // LOGIN PAGE
      {
        path: "login",

        element: <Login />,

        errorElement: <Error />,
      },

      // BUDGET PAGE
      {
        path: "budget/:id",

        element: (
          <ProtectedRoute>
            <BudgetPage />
          </ProtectedRoute>
        ),

        loader: budgetLoader,

        action: budgetAction,

        errorElement: <Error />,

        children: [
          {
            path: "delete",

            action: deleteBudget,
          },
        ],
      },

      // EXPENSES PAGE
      {
        path: "expenses",

        element: (
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        ),

        loader: expensesLoader,

        action: expensesAction,

        errorElement: <Error />,
      },

      // REAUTHENTICATE
      {
        path: "reauthenticate",

        element: (
          <ProtectedRoute>
            <ReauthenticatePage />
          </ProtectedRoute>
        ),

        errorElement: <Error />,
      },

      // LOGOUT
      {
        path: "logout",

        action: logoutAction,
      },
    ],
  },
]);

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // loading screen
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          fontWeight: "700",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="App">
      <RouterProvider router={router} />

      <Toaster position="top-center" />
    </div>
  );
}

export default App;
