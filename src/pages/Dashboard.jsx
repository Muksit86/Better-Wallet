// react imports
import { useEffect, useState } from "react";

// rrd imports
import { Link } from "react-router-dom";

// firebase auth
import { auth } from "../firebase/firebase";

// library imports
import toast from "react-hot-toast";

// components
import Intro from "../components/Intro";
import AddBudgetForm from "../components/AddBudgetForm";
import AddExpenseFrom from "../components/AddExpenseFrom";
import BudgetItem from "../components/BudgetItem";
import Table from "../components/Table";
import Analytics from "../components/Analytics";

// firebase firestore
import {
  addBudgetToFirestore,
  addExpenseToFirestore,
  deleteExpenseFromFirestore,
  getBudgetsFromFirestore,
  subscribeToBudgets,
  subscribeToExpenses,
} from "../firebase/firestore";

// stable colors
const generatedColors = [
  "0 65% 51%",
  "34 85% 46%",
  "74 70% 45%",
  "104 65% 48%",
  "134 61% 50%",
  "262 83% 58%",
  "320 70% 55%",
  "12 80% 55%",
  "45 90% 50%",
];

// loader
export async function dashboardLoader() {
  return null;
}

// action
export async function dashboardAction({ request }) {
  const data = await request.formData();

  const { _action, ...values } = Object.fromEntries(data);

  // create budget
  if (_action === "createBudget") {
    if (!values.newBudget.trim()) {
      return toast.error("Budget name is required");
    }

    if (Number(values.newBudgetAmount) <= 0) {
      return toast.error("Budget amount must be greater than 0");
    }

    try {
      const budgets = await getBudgetsFromFirestore();

      const highestColorIndex =
        budgets.length > 0
          ? Math.max(...budgets.map((budget) => budget.colorIndex || 0))
          : -1;

      const colorIndex = highestColorIndex + 1;

      const color = generatedColors[colorIndex % generatedColors.length];

      await addBudgetToFirestore({
        name: values.newBudget.trim(),

        amount: values.newBudgetAmount,

        color,

        colorIndex,

        createdAt: Date.now(),
      });

      return toast.success("Budget Created!");
    } catch (e) {
      console.log(e);

      throw new Error("There was a problem creating your budget.");
    }
  }

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
      console.log(e);

      throw new Error("There was a problem creating your expense.");
    }
  }

  // delete expense
  if (_action === "deleteExpense") {
    try {
      await deleteExpenseFromFirestore(values.expenseId);

      return toast.success("Expense deleted!");
    } catch (e) {
      console.log(e);

      throw new Error("There was a problem deleting your expense.");
    }
  }

  return null;
}

const Dashboard = () => {
  const [budgets, setBudgets] = useState([]);

  const [expenses, setExpenses] = useState([]);

  // firebase user
  const user = auth.currentUser || null;

  // realtime listeners
  useEffect(() => {
    if (!user) return;

    // budgets listener
    const unsubscribeBudgets = subscribeToBudgets((budgetsData) => {
      const sortedBudgets = [...budgetsData].sort(
        (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
      );

      setBudgets(sortedBudgets);
    });

    // expenses listener
    const unsubscribeExpenses = subscribeToExpenses((expensesData) => {
      setExpenses(expensesData);
    });

    // cleanup
    return () => {
      if (unsubscribeBudgets) {
        unsubscribeBudgets();
      }

      if (unsubscribeExpenses) {
        unsubscribeExpenses();
      }
    };
  }, [user]);

  // calculate spent
  const budgetsWithSpent = budgets.map((budget, index) => {
    const spent = expenses
      .filter((expense) => expense.budgetId === budget.id)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    return {
      ...budget,

      color:
        typeof budget.color === "string" && budget.color.trim() !== ""
          ? budget.color
          : generatedColors[index % generatedColors.length],

      spent,
    };
  });

  return (
    <>
      {user ? (
        <div className="dashboard">
          {/* heading */}
          <h1>
            Welcome back,{" "}
            <span className="accent">
              {user.displayName ||
                user.providerData?.[0]?.displayName ||
                user.email?.split("@")[0]}
            </span>
          </h1>

          <div className="grid-sm">
            {budgetsWithSpent.length > 0 ? (
              <div className="grid-lg">
                {/* forms */}
                <div className="flex-lg">
                  <AddBudgetForm />

                  <AddExpenseFrom budgets={budgetsWithSpent} />
                </div>

                {/* analytics */}
                <Analytics budgets={budgetsWithSpent} expenses={expenses} />

                {/* budgets */}
                <h2>Existing Budgets</h2>

                <div className="budgets">
                  {budgetsWithSpent.map((budget) => (
                    <BudgetItem key={budget.id} budget={budget} />
                  ))}
                </div>

                {/* expenses */}
                {expenses.length > 0 && (
                  <div className="grid-md">
                    <h2>Recent Expenses</h2>

                    <Table
                      expenses={[...expenses]
                        .sort((a, b) => b.createdAt - a.createdAt)
                        .slice(0, 8)}
                      budgets={budgetsWithSpent}
                    />

                    {/* all expenses button */}
                    <Link to="/expenses" className="btn btn--dark">
                      View all expenses
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid-sm">
                <p>Personal budgeting is the secret to financial freedom.</p>

                <p>Create a budget to get started!</p>

                <AddBudgetForm />
              </div>
            )}
          </div>
        </div>
      ) : (
        <Intro />
      )}
    </>
  );
};

export default Dashboard;
