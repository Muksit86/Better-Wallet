import { Link, useFetcher } from "react-router-dom";

import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/solid";

import { formatCurrency, formatDateToLocaleString } from "../helpers";

import { useState } from "react";

import { updateExpenseInFirestore } from "../firebase/firestore";

import toast from "react-hot-toast";

const ExpenseItem = ({ expense, budgets = [], showBudget }) => {
  const fetcher = useFetcher();

  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(expense.name);

  const [amount, setAmount] = useState(expense.amount);

  // matching budget
  const budget = budgets.find((b) => b.id === expense.budgetId);

  // save expense
  const handleSave = async () => {
    try {
      if (!name.trim()) {
        toast.error("Expense name is required");
        return;
      }

      if (Number(amount) <= 0) {
        toast.error("Expense amount must be greater than 0");
        return;
      }

      await updateExpenseInFirestore(expense.id, {
        name: name.trim(),

        amount: Number(amount),
      });

      toast.success("Expense updated!");

      // close edit mode
      setEditing(false);
    } catch (error) {
      toast.error("Failed to update expense");
    }
  };

  return (
    <>
      {/* expense name */}
      <td>
        {editing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          <span title={expense.name}>
            {expense.name.length > 30
              ? `${expense.name.slice(0, 30)}...`
              : expense.name}
          </span>
        )}
      </td>

      {/* amount */}
      <td>
        {editing ? (
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        ) : (
          formatCurrency(Number(expense.amount))
        )}
      </td>

      {/* date */}
      <td>{formatDateToLocaleString(expense.createdAt)}</td>

      {/* budget badge */}
      {showBudget && (
        <td>
          {budget ? (
            <Link
              to={`/budget/${budget.id}`}
              title={budget.name}
              style={{
                "--backdrop": `hsl(${budget.color})`,
                background: `hsl(${budget.color})`,
                color: "#fff",
                padding: "0.45rem 1rem",
                borderRadius: "100rem",
                textDecoration: "none",
                fontWeight: "600",
                display: "inline-block",
                minWidth: "120px",
                textAlign: "center",
              }}
            >
              {budget.name.length > 20
                ? `${budget.name.slice(0, 20)}...`
                : budget.name}
            </Link>
          ) : (
            <span>No Budget</span>
          )}
        </td>
      )}

      {/* edit / save */}
      <td align="center">
        {editing ? (
          <button
            className="btn btn--outline"
            onClick={handleSave}
            style={{
              "--outline": "#22c55e",

              "--backdrop": "#22c55e",

              fontWeight: "700",

              minWidth: "90px",

              paddingLeft: "1rem",

              paddingRight: "1rem",

              justifyContent: "center",
            }}
          >
            Save
          </button>
        ) : (
          <button
            className="btn btn--outline"
            onClick={() => setEditing(true)}
            title="Edit Expense"
            style={{
              "--outline": "#f97316",

              "--backdrop": "#f97316",
            }}
          >
            <PencilSquareIcon width={22} />
          </button>
        )}
      </td>

      {/* cancel / delete */}
      <td align="center">
        {editing ? (
          <button
            className="btn btn--outline"
            onClick={() => {
              setName(expense.name);
              setAmount(expense.amount);
              setEditing(false);
            }}
            title="Cancel"
            style={{
              "--outline": "#6b7280",

              "--backdrop": "#6b7280",

              fontWeight: "700",

              minWidth: "90px",
            }}
          >
            Cancel
          </button>
        ) : (
          <fetcher.Form method="post">
            <input type="hidden" name="_action" value="deleteExpense" />

            <input type="hidden" name="expenseId" value={expense.id} />

            <button
              type="submit"
              className="btn btn--warning"
              aria-label={`Delete ${expense.name} expense`}
            >
              <TrashIcon width={20} />
            </button>
          </fetcher.Form>
        )}
      </td>
    </>
  );
};

export default ExpenseItem;
