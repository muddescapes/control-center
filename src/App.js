import React from "react";
import "./App.css";

function App() {
  const reference = {
    var1: { options: ["true", "false"], realState: "false" },
    var2: { options: ["red", "blue"], realState: "red" },
    var3: { options: ["open", "closed"], realState: "open" },
  };

  const MQTTmessage = "door-status {open, closed, halfway} status=closed";

  const [vars, setVars] = React.useState({});

  // currState is a dictionary that lets you lookup what the current state of each variable is
  // setCurrState is a function you have to use to change currState
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
          {Object.entries(vars).map(([name, { options, realState: curr }]) => (
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
                      onChange={() => setTempStateHelper(name, option)}
                    />{" "}
                    {option}
                  </React.Fragment>
                ))}
              </div>
              <div className="grid-element">{curr}</div>
            </React.Fragment>
          ))}
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
    let options = message
      .split("{")[1]
      .split("}")[0]
      .replace(/ /g, "")
      .split(",");
    let currState = message.split("status=").at(-1);

    setVars({
      ...vars,
      [varName]: { options: options, realState: currState },
    });

    setTempStateHelper(varName, currState);
  }

  function sayHello() {
    alert("You clicked me!");
    // send message of mqtt with modified entries of currState
  }

  // delete this later
  function refresh() {
    unpackMQTT(MQTTmessage);
  }
}

export default App;
