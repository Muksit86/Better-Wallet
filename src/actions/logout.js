// rrd imports
import { redirect } from "react-router-dom";

// library
import toast from "react-hot-toast";

// firebase auth
import { signOut } from "firebase/auth";

import { auth } from "../firebase/firebase";

export async function logoutAction() {
  await signOut(auth);

  localStorage.removeItem("userName");

  toast.success("Logged out successfully!");

  return redirect("/");
}
