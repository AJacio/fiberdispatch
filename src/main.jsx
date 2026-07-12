import React from "react";
import ReactDOM from "react-dom/client";
import FiberDispatch from "./FiberDispatch.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FiberDispatch />
  </React.StrictMode>
);
