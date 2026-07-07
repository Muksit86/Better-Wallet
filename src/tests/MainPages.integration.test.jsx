import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { sendPasswordResetEmail } from "firebase/auth";

import Dashboard from "../pages/Dashboard";
import ExpensesPage from "../pages/ExpensesPage";
import Login from "../pages/Login";
import ReauthenticatePage from "../pages/ReauthenticatePage";
import ErrorPage from "../pages/Error";
import exportPDF from "../utils/exportPDF";
import toast from "react-hot-toast";
import {
  reauthenticateGithubUser,
  reauthenticateGoogleUser,
} from "../firebase/reauthenticate";
import { deleteAccountCompletely } from "../firebase/deleteAccount";

const pageMocks = vi.hoisted(() => ({
  currentUser: null,
  budgetsSubscriber: null,
  expensesSubscriber: null,
}));

vi.mock("../firebase/firebase", () => ({
  auth: {
    get currentUser() {
      return pageMocks.currentUser;
    },
  },
}));

vi.mock("../firebase/firestore", () => ({
  getBudgetsFromFirestore: vi.fn(),
  getExpensesFromFirestore: vi.fn(),
  addBudgetToFirestore: vi.fn(),
  addExpenseToFirestore: vi.fn(),
  deleteExpenseFromFirestore: vi.fn(),
  subscribeToBudgets: vi.fn((callback) => {
    pageMocks.budgetsSubscriber = callback;
    return vi.fn();
  }),
  subscribeToExpenses: vi.fn((callback) => {
    pageMocks.expensesSubscriber = callback;
    return vi.fn();
  }),
  updateBudgetInFirestore: vi.fn(),
  updateExpenseInFirestore: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({}),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: { uid: "test-user" },
  }),
  GoogleAuthProvider: vi.fn(),
  GithubAuthProvider: vi.fn(),
  signInWithPopup: vi.fn().mockResolvedValue({}),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  setPersistence: vi.fn().mockResolvedValue(undefined),
  browserLocalPersistence: {},
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../firebase/reauthenticate", () => ({
  reauthenticatePasswordUser: vi.fn(),
  reauthenticateGoogleUser: vi.fn(),
  reauthenticateGithubUser: vi.fn(),
}));

vi.mock("../firebase/deleteAccount", () => ({
  deleteAccountCompletely: vi.fn(),
}));

vi.mock("../utils/exportPDF", () => ({
  default: vi.fn(),
}));

vi.mock("../utils/exportBudgetPDF", () => ({
  default: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => null,
  Tooltip: () => null,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: ({ children }) => <div>{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

const signedInUser = {
  uid: "user-1",
  displayName: "Ada",
  email: "ada@example.com",
  providerData: [{ providerId: "password", displayName: "Ada" }],
};

const budget = {
  id: "budget-1",
  name: "Food",
  amount: 500,
  color: "34 85% 46%",
  createdAt: 1,
};

const expense = {
  id: "expense-1",
  name: "Lunch",
  amount: 25,
  budgetId: "budget-1",
  createdAt: 2,
};

function renderRoute(element, initialPath = "/") {
  const router = createMemoryRouter(
    [
      {
        path: initialPath,
        element,
      },
    ],
    {
      initialEntries: [initialPath],
    },
  );

  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  pageMocks.currentUser = signedInUser;
  pageMocks.budgetsSubscriber = null;
  pageMocks.expensesSubscriber = null;
});

test("dashboard shows the empty-budget onboarding state", async () => {
  renderRoute(<Dashboard />);

  expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
  expect(screen.getByText("Ada")).toBeInTheDocument();
  expect(
    screen.getByText(/create a budget to get started/i),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /create budget/i }),
  ).toBeInTheDocument();
});

test("dashboard shows the signup intro when no user is authenticated", async () => {
  pageMocks.currentUser = null;

  renderRoute(<Dashboard />);

  expect(
    await screen.findByRole("heading", { name: /take control of your money/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /create an account/i }),
  ).toBeInTheDocument();
});

test("dashboard renders realtime budgets and recent expenses", async () => {
  renderRoute(<Dashboard />);

  await waitFor(() => {
    expect(pageMocks.budgetsSubscriber).toEqual(expect.any(Function));
    expect(pageMocks.expensesSubscriber).toEqual(expect.any(Function));
  });

  act(() => {
    pageMocks.budgetsSubscriber([budget]);
    pageMocks.expensesSubscriber([expense]);
  });

  expect(await screen.findByText(/existing budgets/i)).toBeInTheDocument();
  expect(screen.getAllByText("Food")[0]).toBeInTheDocument();
  expect(screen.getByText("Lunch")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /view all expenses/i })).toHaveAttribute(
    "href",
    "/expenses",
  );
});

test("expenses page shows an empty state without expenses", async () => {
  renderRoute(<ExpensesPage />);

  await waitFor(() => {
    expect(pageMocks.expensesSubscriber).toEqual(expect.any(Function));
    expect(pageMocks.budgetsSubscriber).toEqual(expect.any(Function));
  });

  act(() => {
    pageMocks.expensesSubscriber([]);
    pageMocks.budgetsSubscriber([]);
  });

  expect(await screen.findByRole("heading", { name: /all expenses/i }))
    .toBeInTheDocument();
  expect(screen.getByText(/no expenses to show/i)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /export pdf/i }),
  ).not.toBeInTheDocument();
});

test("expenses page renders realtime expenses and exports them", async () => {
  renderRoute(<ExpensesPage />);

  await waitFor(() => {
    expect(pageMocks.expensesSubscriber).toEqual(expect.any(Function));
    expect(pageMocks.budgetsSubscriber).toEqual(expect.any(Function));
  });

  act(() => {
    pageMocks.budgetsSubscriber([budget]);
    pageMocks.expensesSubscriber([expense]);
  });

  expect(await screen.findByText("Lunch")).toBeInTheDocument();
  expect(screen.getByText(/1 total/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /export pdf/i }));

  expect(exportPDF).toHaveBeenCalledWith([expense]);
});

test("login page switches from login to signup mode", async () => {
  pageMocks.currentUser = null;

  renderRoute(<Login />);

  expect(
    await screen.findByRole("heading", { name: /welcome back/i }),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole("link", { name: /create one/i }));

  expect(
    screen.getByRole("heading", { name: /create an account/i }),
  ).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/enter your username/i)).toBeInTheDocument();
});

test("login page redirects authenticated users to the dashboard route", async () => {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <Login />,
      },
      {
        path: "/dashboard",
        element: <div>Dashboard route</div>,
      },
    ],
    {
      initialEntries: ["/"],
    },
  );

  render(<RouterProvider router={router} />);

  expect(await screen.findByText("Dashboard route")).toBeInTheDocument();
});

test("login page sends password reset after an email is entered", async () => {
  pageMocks.currentUser = null;

  renderRoute(<Login />);

  await userEvent.type(
    await screen.findByPlaceholderText(/enter your email/i),
    "ada@example.com",
  );
  await userEvent.click(screen.getByRole("button", { name: /forgot password/i }));

  expect(sendPasswordResetEmail).toHaveBeenCalledWith(
    expect.any(Object),
    "ada@example.com",
  );
  expect(await screen.findByText(/password reset email sent/i))
    .toBeInTheDocument();
});

test("reauthentication page validates password before deleting an account", async () => {
  renderRoute(<ReauthenticatePage />);

  expect(
    await screen.findByRole("heading", { name: /verify your identity/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/email & password/i)).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole("button", { name: /verify identity/i }),
  );

  expect(toast.error).toHaveBeenCalledWith("Please enter your password");
});

test("reauthentication page deletes after Google verification succeeds", async () => {
  pageMocks.currentUser = {
    ...signedInUser,
    providerData: [{ providerId: "google.com" }],
  };

  renderRoute(<ReauthenticatePage />);

  expect(await screen.findByText("Google")).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole("button", { name: /continue with google/i }),
  );

  await waitFor(() => {
    expect(reauthenticateGoogleUser).toHaveBeenCalled();
    expect(deleteAccountCompletely).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      "Account deleted successfully!",
    );
  });
});

test("reauthentication page uses the GitHub verification path", async () => {
  pageMocks.currentUser = {
    ...signedInUser,
    providerData: [{ providerId: "github.com" }],
  };

  renderRoute(<ReauthenticatePage />);

  expect(await screen.findByText("GitHub")).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole("button", { name: /continue with github/i }),
  );

  await waitFor(() => {
    expect(reauthenticateGithubUser).toHaveBeenCalled();
    expect(deleteAccountCompletely).toHaveBeenCalled();
  });
});

test("error page displays route errors and recovery actions", async () => {
  const router = createMemoryRouter(
    [
      {
        path: "/broken",
        element: <div>Broken route</div>,
        loader: () => {
          throw new Error("Route failed");
        },
        errorElement: <ErrorPage />,
      },
    ],
    {
      initialEntries: ["/broken"],
    },
  );

  render(<RouterProvider router={router} />);

  expect(
    await screen.findByRole("heading", { name: /we've got a problem/i }),
  ).toBeInTheDocument();
  expect(screen.getByText("Route failed")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});
