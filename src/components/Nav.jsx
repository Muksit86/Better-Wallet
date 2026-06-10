// rrd imports
import { Form, NavLink, useLocation } from "react-router-dom";

// library icons
import {
  TrashIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";

// assets
import logomark from "../assets/logomark.svg";

const Nav = ({ user }) => {
  const location = useLocation();
  const isReauthPage = location.pathname === "/reauthenticate";
  return (
    <nav>
      {/* logo */}
      <NavLink to="/dashboard" aria-label="Go to dashboard">
        <img src={logomark} alt="" height={30} />

        <span>Expense Manager</span>
      </NavLink>

      {/* buttons */}
      {user && !isReauthPage && (
        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          {/* delete user */}
          <NavLink
            to="/reauthenticate"
            className="btn btn--warning"
            onClick={(event) => {
              if (
                !confirm(
                  "Do you really want to permanently delete your account and all data?",
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <span>Delete User</span>

            <TrashIcon width={20} />
          </NavLink>
          {/* logout */}
          <Form method="post" action="/logout">
            <button
              type="submit"
              className="btn btn--accent"
              style={{
                fontWeight: "600",
              }}
            >
              <span>Log out</span>

              <ArrowRightOnRectangleIcon width={20} />
            </button>
          </Form>
        </div>
      )}
    </nav>
  );
};

export default Nav;
