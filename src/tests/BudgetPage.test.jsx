import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, test, vi } from "vitest";

import BudgetPage from "../pages/BudgetPage";
import exportBudgetPDF from "../utils/exportBudgetPDF";

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

vi.mock("../firebase/firestore", () => ({
  getBudgetsFromFirestore: vi.fn(),
  getExpensesFromFirestore: vi.fn(),
  addExpenseToFirestore: vi.fn(),
  deleteExpenseFromFirestore: vi.fn(),
  subscribeToBudgets: vi.fn(() => vi.fn()),
  subscribeToExpenses: vi.fn(() => vi.fn()),
  updateBudgetInFirestore: vi.fn(),
  updateExpenseInFirestore: vi.fn(),
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
}));

const staleBudget = {
  id: "budget-1",
  name: "Food",
  amount: 500,
  color: "34 85% 46%",
  spent: 10,
};

const currentExpenses = [
  {
    id: "expense-1",
    name: "Lunch",
    amount: 25,
    budgetId: "budget-1",
    createdAt: Date.now(),
  },
];

function renderBudgetPage() {
  const router = createMemoryRouter(
    [
      {
        path: "/budget/:id",
        element: <BudgetPage />,
        loader: () => ({
          budget: staleBudget,
          expenses: currentExpenses,
        }),
      },
    ],
    {
      initialEntries: ["/budget/budget-1"],
    },
  );

  render(<RouterProvider router={router} />);
}

test("keeps budget spent total in sync with current expenses", async () => {
  renderBudgetPage();

  expect(await screen.findByText(/25 Spent/i)).toBeInTheDocument();
  expect(screen.queryByText(/10 Spent/i)).not.toBeInTheDocument();
});

test("exports the budget report with the current spent total", async () => {
  renderBudgetPage();

  await userEvent.click(
    await screen.findByRole("button", { name: /download report/i }),
  );

  expect(exportBudgetPDF).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "budget-1",
      spent: 25,
    }),
    currentExpenses,
  );
});
