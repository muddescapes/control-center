import "./FixMqttImport";
import { useMqttState, useSubscription } from "mqtt-react-hooks";
import React from "react";
import "./App.css";

const MQTT_TOPIC = "muddescapes-esp/test";

function App() {
  const { client } = useMqttState();
  const { message, connectionStatus } = useSubscription(MQTT_TOPIC);

  // dummy state variable to get the component to rerender every second
  const [, setCurrTime] = React.useState(Date.now());
  // console.log(message, connectionStatus);

  // message will be defined when it's receiving a message through MQTT
  React.useEffect(() => {
    if (message) {
      const messageStr = message.message;
      console.log(messageStr);
      unpackMQTT(messageStr);
    }
  }, [message]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  });

  const reference = {
    var1: { options: ["true", "false"], realState: "false" },
    var2: { options: ["red", "blue"], realState: "red" },
    var3: { options: ["open", "closed"], realState: "open" },
  };

  const MQTTmessage = "door-status {open, closed, halfway} status=closed";

  const [vars, setVars] = React.useState({});
  const [changedVars, setChangedVars] = React.useState([]);

  // tempState is a dictionary that lets you lookup what the current state of each variable is
  // setTempState is a function you have to use to change currState
  const [tempState, setTempState] = React.useState(
    Object.fromEntries(
      Object.entries(vars).map(([name, { realState: curr }]) => [name, curr])
    )
  );

  // updating the current state of one of the variables (name) to value
  function setTempStateHelper(name, value) {
    setTempState({ ...tempState, [name]: value });
  }

  return (
    <div className="App">
      <header className="App-header">MuddEscapes Control Center</header>
      <div className="Outer-container">
        <div className="grid-container">
          {/* maps the items in vars to "name", "options" "curr" for doing for loop on it */}
          {Object.entries(vars).map(
            ([name, { options, realState: curr, changedAt }]) => (
              // React fragment allows us to have multiple divs in the same level (without it, you can only have one parent div)
              <React.Fragment key={name}>
                <div className="grid-element">{name}</div>
                <div
                  className={
                    tempState[name] !== curr ? "changed" : "grid-element"
                  }
                >
                  {options.map((option) => (
                    <React.Fragment key={option}>
                      <input
                        type="radio"
                        value={option}
                        checked={tempState[name] === option}
                        onChange={() => {
                          setTempStateHelper(name, option);
                          setChangedVars([...changedVars, name]);
                        }}
                      />{" "}
                      {option}
                    </React.Fragment>
                  ))}
                </div>
                <div className="grid-element">{curr}</div>
                <div className="grid-element">
                  {(Date.now() - changedAt) / 1000}s ago
                </div>
              </React.Fragment>
            )
          )}
        </div>
        <div>
          <button onClick={sayHello}>SEND CHANGES</button>
        </div>
        <div>
          <button onClick={refresh}>REFRESH</button>
        </div>
      </div>
    </div>
  );

  function unpackMQTT(message) {
    let varName = message.split(" ")[0];

    if (varName === "set") {
      return;
    }

    let options = message
      .split("{")[1]
      .split("}")[0]
      .replace(/ /g, "")
      .split(",");
    let currState = message.split("status=").at(-1);

    if (changedVars.includes(varName)) {
      return;
    }

    setVars({
      ...vars,
      [varName]: {
        options: options,
        realState: currState,
        changedAt: Date.now(),
      },
    });

    setTempStateHelper(varName, currState);
  }

  // send message of mqtt with modified entries of currState
  function sayHello() {
    const changedNames = Object.entries(tempState)
      .filter(([name, value]) => vars[name].realState !== value)
      .map(([name, value]) => name);

    console.log(changedNames);
    let newMessage = "";

    for (let i = 0; i < changedNames.length; i++) {
      newMessage =
        "set " +
        changedNames[i] +
        " {" +
        vars[changedNames[i]]["options"].join(", ") +
        "} status=" +
        tempState[changedNames[i]];

      console.log(newMessage);
      client.publish(MQTT_TOPIC, newMessage);
    }

    setChangedVars([]);
  }

  // delete this later
  function refresh() {
    unpackMQTT(MQTTmessage);
    console.log(tempState);
  }
}

export default App;
