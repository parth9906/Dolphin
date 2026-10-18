import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";

import { router } from "./router";
import { authSession } from "../lib/auth/auth-session";

export function App() {
  useEffect(() => {
    authSession.initialize();
  }, []);

  return <RouterProvider router={router} />;
}