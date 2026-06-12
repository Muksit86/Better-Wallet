// rrd imports
import { useLoaderData } from "react-router-dom";
import { useEffect, useState } from "react";

// library
import toast from "react-hot-toast";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import { formatCompactCurrency } from "../helpers";

// components
import BudgetItem from "../components/BudgetItem";
import AddExpenseFrom from "../components/AddExpenseFrom";
import Table from "../components/Table";

// pdf export
import exportBudgetPDF from "../utils/exportBudgetPDF";

// firebase firestore
import {
  getBudgetsFromFirestore,
  getExpensesFromFirestore,
  addExpenseToFirestore,
  deleteExpenseFromFirestore,
  subscribeToBudgets,
  subscribeToExpenses,
} from "../firebase/firestore";

// loader
export async function budgetLoader({ params }) {
  const budgets = await getBudgetsFromFirestore();

  const expenses = await getExpensesFromFirestore();

  let budget = budgets.find((budget) => budget.id === params.id);

  // refresh fix
  if (!budget) {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const retryBudgets = await getBudgetsFromFirestore();

    const retryExpenses = await getExpensesFromFirestore();

    budget = retryBudgets.find((budget) => budget.id === params.id);

    if (!budget) {
      throw new Error("The budget you're trying to find doesn't exist");
    }

    const retryBudgetExpenses = retryExpenses.filter(
      (expense) => expense.budgetId === params.id,
    );

    const retrySpent = retryBudgetExpenses.reduce(
      (acc, curr) => acc + Number(curr.amount),
      0,
    );

    return {
      budget: {
        ...budget,
        spent: retrySpent,
      },

      expenses: retryBudgetExpenses,
    };
  }

  const budgetExpenses = expenses.filter(
    (expense) => expense.budgetId === params.id,
  );

  // calculate spent
  const spent = budgetExpenses.reduce(
    (acc, curr) => acc + Number(curr.amount),
    0,
  );

  const budgetWithSpent = {
    ...budget,
    spent,
  };

  return {
    budget: budgetWithSpent,

    expenses: budgetExpenses,
  };
}

// action
export async function budgetAction({ request }) {
  const data = await request.formData();

  const { _action, ...values } = Object.fromEntries(data);

  // create expense
  if (_action === "createExpense") {
    if (!values.newExpense.trim()) {
      return toast.error("Expense name is required");
    }

    if (Number(values.newExpenseAmount) <= 0) {
      return toast.error("Expense amount must be greater than 0");
    }
    try {
      await addExpenseToFirestore({
        name: values.newExpense.trim(),

        amount: values.newExpenseAmount,

        budgetId: values.newExpenseBudget,

        createdAt: Date.now(),
      });

      return toast.success(`Expense ${values.newExpense.trim()} Created!`);
    } catch (e) {
      throw new Error("There was a problem creating your expense.");
    }
  }

  // delete expense
  if (_action === "deleteExpense") {
    try {
      await deleteExpenseFromFirestore(values.expenseId);

      return toast.success("Expense deleted!");
    } catch (e) {
      throw new Error("There was a problem deleting your expense.");
    }
  }
}

const BudgetPage = () => {
  const loaderData = useLoaderData();

  const [budget, setBudget] = useState(loaderData.budget);

  const [expenses, setExpenses] = useState(loaderData.expenses);

  useEffect(() => {
    const unsubscribeBudgets = subscribeToBudgets((budgetsData) => {
      const updatedBudget = budgetsData.find(
        (b) => b.id === loaderData.budget.id,
      );

      if (updatedBudget) {
        const spent = expenses
          .filter((expense) => expense.budgetId === updatedBudget.id)
          .reduce((acc, curr) => acc + Number(curr.amount), 0);

        setBudget({
          ...updatedBudget,
          spent,
        });
      }
    });

    const unsubscribeExpenses = subscribeToExpenses((expensesData) => {
      setExpenses(
        expensesData.filter(
          (expense) => expense.budgetId === loaderData.budget.id,
        ),
      );
    });

    return () => {
      unsubscribeBudgets();
      unsubscribeExpenses();
    };
  }, [loaderData.budget.id]);

  // analytics calculations
  const totalSpent = expenses.reduce(
    (acc, expense) => acc + Number(expense.amount),
    0,
  );

  const remaining = Number(budget.amount) - totalSpent;

  const highestExpense =
    expenses.length > 0
      ? Math.max(...expenses.map((expense) => Number(expense.amount)))
      : 0;

  const pieData =
    remaining > 0
      ? [
          {
            name: "Spent",
            value: totalSpent,
          },
          {
            name: "Remaining",
            value: remaining,
          },
        ]
      : [
          {
            name: "Spent",
            value: totalSpent,
          },
        ];

  const chartData = expenses.map((expense) => ({
    name:
      expense.name.length > 8 ? expense.name.slice(0, 8) + "…" : expense.name,

    amount: Number(expense.amount),
  }));

  return (
    <div
      className="grid-lg"
      style={{
        "--accent": budget.color,
      }}
    >
      {/* heading */}
      <div
        className="flex-lg"
        style={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 className="h2">
          <span className="accent" title={budget.name}>
            {budget.name.length > 20
              ? `${budget.name.slice(0, 20)}...`
              : budget.name}
          </span>{" "}
          Overview
        </h1>

        <button
          className="btn btn--dark"
          onClick={() => exportBudgetPDF(budget, expenses)}
        >
          <DocumentArrowDownIcon width={20} />

          <span>Download Report</span>
        </button>
      </div>

      {/* top cards */}
      <div className="flex-lg">
        <BudgetItem budget={budget} showDelete={true} />

        <AddExpenseFrom budgets={[budget]} />
      </div>

      {/* analytics */}
      <div className="analytics">
        {/* cards */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>Total Budget</h4>

            <h2>{formatCompactCurrency(Number(budget.amount))}</h2>
          </div>

          <div className="analytics-card">
            <h4>Total Spent</h4>

            <h2>{formatCompactCurrency(totalSpent)}</h2>
          </div>

          <div className="analytics-card">
            <h4>Remaining</h4>

            <h2
              style={{
                color: remaining < 0 ? "#ef4444" : "#22c55e",
              }}
            >
              {formatCompactCurrency(remaining)}
            </h2>
          </div>

          <div className="analytics-card">
            <h4>Total Transactions</h4>

            <h2>{expenses.length}</h2>

            <small>
              Highest Expense: {formatCompactCurrency(highestExpense)}
            </small>
          </div>
        </div>

        {/* charts */}
        <div className="analytics-chart-grid">
          {/* donut chart */}
          <div className="chart-card">
            <h3>Budget Overview</h3>

            {expenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={95}
                    outerRadius={130}
                    paddingAngle={3}
                    cornerRadius={10}
                    stroke="none"
                    animationDuration={1400}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={index === 0 ? `hsl(${budget.color})` : "#d1d5db"}
                        style={{
                          filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.12))",
                        }}
                      />
                    ))}
                  </Pie>

                  <text
                    x="50%"
                    y="48%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      fill: "#111827",
                    }}
                  >
                    {formatCompactCurrency(totalSpent)}
                  </text>

                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: "0.9rem",
                      fill: "#6b7280",
                      fontWeight: 600,
                    }}
                  >
                    Spent
                  </text>

                  <Tooltip
                    contentStyle={{
                      borderRadius: "14px",
                      border: "none",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                      background: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="empty-chart"
                style={{
                  height: "320px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#777",
                  fontSize: "1.1rem",
                }}
              >
                No expense data yet
              </div>
            )}
          </div>

          {/* bar chart */}
          <div className="chart-card">
            <h3>Expense Breakdown</h3>

            {expenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    opacity={0.08}
                  />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={{
                      fill: "#6b7280",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tickFormatter={(value) => formatCompactCurrency(value)}
                    tick={{
                      fill: "#6b7280",
                      fontSize: 13,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    cursor={{
                      fill: "rgba(0,0,0,0.04)",
                    }}
                    contentStyle={{
                      borderRadius: "14px",
                      border: "none",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                      background: "#fff",
                    }}
                  />

                  <Bar
                    dataKey="amount"
                    radius={[18, 18, 0, 0]}
                    animationDuration={1400}
                    maxBarSize={65}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(${budget.color})`}
                        style={{
                          filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.12))",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="empty-chart"
                style={{
                  height: "320px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#777",
                  fontSize: "1.1rem",
                }}
              >
                No spending data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* expenses table */}
      {expenses && expenses.length > 0 && (
        <div className="grid-md">
          <h2>
            <span className="accent" title={budget.name}>
              {budget.name.length > 20
                ? `${budget.name.slice(0, 20)}...`
                : budget.name}
            </span>{" "}
            Expenses
          </h2>

          <Table
            expenses={[...expenses].sort(
              (a, b) => Number(b.createdAt) - Number(a.createdAt),
            )}
            showBudget={false}
          />
        </div>
      )}
    </div>
  );
};

export default BudgetPage;
