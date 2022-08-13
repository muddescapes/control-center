import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Connector } from "mqtt-react-hooks";
import { v4 as uuidv4 } from "uuid";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Connector
      brokerUrl="wss://mqtt.eclipseprojects.io"
      options={{
        path: "/mqtt",
        clientId: `muddescapes-cc-${uuidv4()}`,
      }}
    >
      <App />
    </Connector>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
