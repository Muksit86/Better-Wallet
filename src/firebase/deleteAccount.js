import { deleteUser } from "firebase/auth";

import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

export const deleteAccountCompletely = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not found");
  }

  // expenses
  const expensesQuery = query(
    collection(db, "expenses"),
    where("uid", "==", user.uid),
  );

  const expensesSnapshot = await getDocs(expensesQuery);

  await Promise.all(
    expensesSnapshot.docs.map((expense) =>
      deleteDoc(doc(db, "expenses", expense.id)),
    ),
  );

  // budgets
  const budgetsQuery = query(
    collection(db, "budgets"),
    where("uid", "==", user.uid),
  );

  const budgetsSnapshot = await getDocs(budgetsQuery);

  await Promise.all(
    budgetsSnapshot.docs.map((budget) =>
      deleteDoc(doc(db, "budgets", budget.id)),
    ),
  );

  // auth account
  await deleteUser(user);

  localStorage.removeItem("userName");
};
