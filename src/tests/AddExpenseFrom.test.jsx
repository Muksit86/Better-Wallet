import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import AddExpenseFrom from "../components/AddExpenseFrom";

const budgets = [
  {
    id: "1",
    name: "Food",
    createdAt: 1,
  },
  {
    id: "2",
    name: "Travel",
    createdAt: 2,
  },
];

function renderForm(budgetData = budgets) {
  const router = createMemoryRouter([
    {
      path: "/",
      element: <AddExpenseFrom budgets={budgetData} />,
    },
  ]);

  render(<RouterProvider router={router} />);
}

//    ************Amount Input************

//Zero
test("amount should be invalid when zero", async () => {
  renderForm();

  const amountInput = screen.getByLabelText(/amount/i);

  await userEvent.type(amountInput, "0");

  expect(amountInput).toBeInvalid();
});

//Value below minimum
test("amount should be invalid when below minimum", async () => {
  renderForm();

  const amountInput = screen.getByLabelText(/amount/i);

  await userEvent.type(amountInput, "0.009");

  expect(amountInput).toBeInvalid();
});

//Exactly minimum value
test("amount should be valid at minimum value", async () => {
  renderForm();

  const amountInput = screen.getByLabelText(/amount/i);

  await userEvent.type(amountInput, "0.01");

  expect(amountInput).toBeValid();
});

//Large number
test("amount should accept very large values", async () => {
  renderForm();

  const amountInput = screen.getByLabelText(/amount/i);

  await userEvent.type(amountInput, "999999999");

  expect(amountInput).toBeValid();
});

//Decimal value
test("amount should accept decimal values", async () => {
  renderForm();

  const amountInput = screen.getByLabelText(/amount/i);

  await userEvent.type(amountInput, "99.99");

  expect(amountInput).toBeValid();
});

//    ************Expense Name Input************

//Single character
test("expense name accepts a single character", async () => {
  renderForm();

  const input = screen.getByLabelText(/expense name/i);

  await userEvent.type(input, "A");

  expect(input).toHaveValue("A");
});

//Long name
test("expense name accepts very long text", async () => {
  renderForm();

  const input = screen.getByLabelText(/expense name/i);

  const longName = "A".repeat(200);

  await userEvent.type(input, longName);

  expect(input).toHaveValue(longName);
});

//Special characters
test("expense name accepts special characters", async () => {
  renderForm();

  const input = screen.getByLabelText(/expense name/i);

  await userEvent.type(input, "Coffee & Snacks!");

  expect(input).toHaveValue("Coffee & Snacks!");
});

//Leading and trailing spaces
test("expense name preserves spaces", async () => {
  renderForm();

  const input = screen.getByLabelText(/expense name/i);

  await userEvent.type(input, "  Coffee  ");

  expect(input).toHaveValue("  Coffee  ");
});

//Unicode or international text
test("expense name accepts unicode characters", async () => {
  renderForm();

  const input = screen.getByLabelText(/expense name/i);

  await userEvent.type(input, "Café");

  expect(input).toHaveValue("Café");
});

//    ************CreateBudget Form Test************

//Form renders correctly
test("renders add expense form", () => {
  renderForm();

  expect(
    screen.getByRole("button", { name: /add expense/i }),
  ).toBeInTheDocument();
});

//Required fields exist
test("expense form fields are required", () => {
  renderForm();

  expect(screen.getByLabelText(/expense name/i)).toBeRequired();
  expect(screen.getByLabelText(/amount/i)).toBeRequired();
  expect(screen.getByLabelText(/budget category/i)).toBeRequired();
});

//Budget dropdown is rendered
test("budget category dropdown is rendered", () => {
  renderForm();

  expect(screen.getByLabelText(/budget category/i)).toBeInTheDocument();
});

//Budget dropdown contains options
test("budget dropdown displays options", () => {
  renderForm(budgets);

  expect(screen.getByRole("option", { name: /food/i })).toBeInTheDocument();

  expect(screen.getByRole("option", { name: /travel/i })).toBeInTheDocument();
});

//Dropdown options are sorted by createdAt
test("budgets are sorted by createdAt", () => {
  renderForm([
    { id: "2", name: "Travel", createdAt: 2 },
    { id: "1", name: "Food", createdAt: 1 },
  ]);

  const options = screen.getAllByRole("option");

  expect(options[0]).toHaveTextContent("Food");
  expect(options[1]).toHaveTextContent("Travel");
});

//Dropdown hidden when only one budget exists
test("hides budget category when only one budget exists", () => {
  renderForm([
    {
      id: "1",
      name: "Food",
      createdAt: 1,
    },
  ]);

  const select = screen.getByLabelText(/budget category/i);

  expect(select).not.toBeVisible();
});
