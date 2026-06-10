// react imports
import { useState } from "react";

// rrd imports
import { Form, Link } from "react-router-dom";

// library imports
import {
  BanknotesIcon,
  TrashIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

// helper functions
import {
  formatCurrency,
  formatCompactCurrency,
  formatPercentage,
} from "../helpers";

// firebase
import { updateBudgetInFirestore } from "../firebase/firestore";

// toast
import toast from "react-hot-toast";

const BudgetItem = ({ budget, showDelete = false }) => {
  const { id, name, amount, color, spent = 0 } = budget;

  // editing state
  const [editing, setEditing] = useState(false);

  // form states
  const [budgetName, setBudgetName] = useState(name);

  const [budgetAmount, setBudgetAmount] = useState(amount);

  // save updated budget
  const handleSave = async () => {
    try {
      if (!budgetName.trim()) {
        toast.error("Budget name is required");
        return;
      }

      if (Number(budgetAmount) <= 0) {
        toast.error("Budget amount must be greater than 0");
        return;
      }

      await updateBudgetInFirestore(id, {
        name: budgetName.trim(),

        amount: Number(budgetAmount),
      });

      toast.success("Budget updated!");

      setEditing(false);
    } catch (error) {
      toast.error("Failed to update budget");
    }
  };

  return (
    <div
      className="budget"
      style={{
        "--accent": color,
      }}
    >
      {/* top section */}
      <div className="progress-text">
        {editing ? (
          <div style={{ width: "100%" }}>
            <input
              type="text"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              style={{
                marginBottom: "0.7rem",
              }}
            />

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
            />
          </div>
        ) : (
          <>
            <h3 title={name}>
              {name.length > 20 ? `${name.slice(0, 20)}...` : name}
            </h3>

            <p>{formatCompactCurrency(Number(amount))} Budgeted</p>
          </>
        )}
      </div>

      {/* progress bar */}
      <progress max={Number(amount)} value={spent}>
        {formatPercentage(spent / Number(amount || 1))}
      </progress>

      {/* bottom text */}
      <div className="progress-text">
        <small>{formatCompactCurrency(spent)} Spent</small>

        <small>{formatCompactCurrency(Number(amount) - spent)} Remaining</small>
      </div>

      {/* buttons */}
      <div
        className="flex-sm"
        style={{
          marginTop: "1rem",
          alignItems: "center",
          gap: "0.8rem",
          flexWrap: "wrap",
        }}
      >
        {editing ? (
          <>
            {/* save */}
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

            {/* cancel */}
            <button
              className="btn btn--outline"
              onClick={() => {
                setBudgetName(name);
                setBudgetAmount(amount);
                setEditing(false);
              }}
              style={{
                "--outline": "#6b7280",

                "--backdrop": "#6b7280",

                fontWeight: "700",

                minWidth: "90px",
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {/* view details */}
            {!showDelete && (
              <Link to={`/budget/${id}`} className="btn">
                <span>View Details</span>

                <BanknotesIcon width={20} />
              </Link>
            )}

            {/* edit button */}
            <button
              className="btn btn--outline"
              onClick={() => setEditing(true)}
              style={{
                "--outline": "#f97316",

                "--backdrop": "#f97316",

                minWidth: "60px",

                height: "48px",
              }}
            >
              <PencilSquareIcon width={20} />
            </button>

            {/* delete budget */}
            {showDelete && (
              <Form
                method="post"
                action="delete"
                onSubmit={(event) => {
                  if (
                    !confirm(
                      "Are you sure you want to permanently delete this budget?",
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <button type="submit" className="btn btn--warning">
                  <span>Delete Budget</span>

                  <TrashIcon width={20} />
                </button>
              </Form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BudgetItem;
