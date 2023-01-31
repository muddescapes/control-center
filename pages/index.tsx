import Image from "next/image";
import logo from "../images/muddescapes-logo.png";
import mqtt from "mqtt";
import React from "react";
import { useResizeDetector } from "react-resize-detector";
import Puzzle, { FunctionState, PuzzleData } from "../components/puzzle";
import assert from "assert";

interface Message {
  time: Date;
  topic: string;
  message: string;
}

const IFRAME_SRC_WIDTH = 1280;
const IFRAME_SRC_HEIGHT = 720;

export default function Home() {
  const [isConnected, setIsConnected] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const {
    width: iframeWidth,
    height: iframeHeight,
    ref: iframeTargetRef,
  } = useResizeDetector<HTMLDivElement>();
  const [puzzles, setPuzzles] = React.useState<PuzzleData[]>([]);
  const [client, setClient] = React.useState<mqtt.MqttClient | null>(null);

  const updateVariable = React.useCallback(function (
    puzzleName: string,
    variableName: string,
    value: boolean
  ) {
    setPuzzles((puzzles) => {
      // case 1: puzzle exists
      if (puzzles.some((puzzle) => puzzle.name === puzzleName)) {
        return puzzles.map((puzzle) => {
          const newPuzzle = { ...puzzle };
          if (newPuzzle.name === puzzleName) {
            newPuzzle.variables.set(variableName, value);
          }
          return newPuzzle;
        });
      }

      // otherwise, create a new puzzle
      return [
        ...puzzles,
        {
          name: puzzleName,
          variables: new Map([[variableName, value]]),
          functions: new Map(),
        },
      ];
    });
  },
  []);

  const setFunctions = React.useCallback(function (
    puzzleName: string,
    functions: string[]
  ) {
    setPuzzles((puzzles) => {
      // case 1: puzzle exists
      if (puzzles.some((puzzle) => puzzle.name === puzzleName)) {
        return puzzles.map((puzzle) => {
          const newPuzzle = { ...puzzle };
          if (newPuzzle.name === puzzleName) {
            newPuzzle.functions = new Map(
              functions.map((functionName) => [
                functionName,
                FunctionState.Idle,
              ])
            );
          }
          return newPuzzle;
        });
      }
      // otherwise, create a new puzzle
      return [
        ...puzzles,
        {
          name: puzzleName,
          variables: new Map(),
          functions: new Map(
            functions.map((functionName) => [functionName, FunctionState.Idle])
          ),
        },
      ];
    });
  },
  []);

  const handleControlMessage = React.useCallback(function (
    topic: string,
    message: string
  ) {
    const puzzleName = topic.split("/")[2];
    const functionName = message.toString();

    // puzzle should exist
    if (!puzzles.some((puzzle) => puzzle.name === puzzleName)) {
      console.error(
        `Received function call ${functionName} for puzzle ${puzzleName} but puzzle does not exist`
      );
    }

    setPuzzles((puzzles) =>
      puzzles.map((puzzle) => {
        const newPuzzle = { ...puzzle };
        if (newPuzzle.name === puzzleName) {
          newPuzzle.functions.set(functionName, FunctionState.Called);
        }
        return newPuzzle;
      })
    );
  },
  []);

  const handleDataMessage = React.useCallback(function (
    topic: string,
    message: string
  ) {
    const topicSplit = topic.split("/");
    const puzzleName = topicSplit[2];
    if (topicSplit.length === 4) {
      // variable update from device
      const variableName = topicSplit[3];
      const variableValue = message === "1";

      updateVariable(puzzleName, variableName, variableValue);
    } else {
      assert(topicSplit.length === 3);

      if (message.startsWith("functions:")) {
        // function list from device
        const functionNames = message.replace(/^(functions:)/, "").split(",");
        setFunctions(puzzleName, functionNames);
      } else {
        // function call completion from device
        const functionName = message;

        // puzzle should exist
        if (!puzzles.some((puzzle) => puzzle.name === puzzleName)) {
          console.error(
            `Received function call completion (${functionName}) for puzzle ${puzzleName} but puzzle does not exist`
          );
        }

        setPuzzles((puzzles) =>
          puzzles.map((puzzle) => {
            const newPuzzle = { ...puzzle };
            if (newPuzzle.name === puzzleName) {
              newPuzzle.functions.set(functionName, FunctionState.Completed);
            }
            return newPuzzle;
          })
        );
      }
    }
  },
  []);

  React.useEffect(() => {
    const client = mqtt.connect("wss://broker.hivemq.com:8884", {
      path: "/mqtt",
    });

    client.on("connect", () => {
      console.debug("connected");
      setIsConnected(true);

      client.subscribe("muddescapes/control/+"); // for function calls from other instances of control-center
      client.subscribe("muddescapes/data/+"); // for function list from device and called functions
      client.subscribe("muddescapes/data/+/+"); // for variable updates from device

      client.publish("muddescapes/", "");
    });

    client.on("message", (topic, message) => {
      setMessages((messages) => [
        {
          time: new Date(),
          topic: topic,
          message: message.toString(),
        },
        ...messages,
      ]);

      if (topic.startsWith("muddescapes/control/")) {
        handleControlMessage(topic, message.toString());
      } else if (topic.startsWith("muddescapes/data/")) {
        handleDataMessage(topic, message.toString());
      }
    });

    setClient(client);

    return () => {
      client.end();
    };
  }, []);

  return (
    <>
      <div className="flex flex-col max-h-screen">
        <div className="flex justify-between items-center px-2 outline outline-1">
          <div className="flex items-center gap-4">
            <Image src={logo} alt="MuddEscapes Logo" height={60} />
            <span className="text-4xl font-semibold">
              MuddEscapes Control Center
            </span>
          </div>
          <div
            className={
              "h-5 w-5 rounded-full justify-self-end " +
              (isConnected ? "bg-green-500" : "bg-red-500")
            }
          ></div>
        </div>
        {/* min-h-0 required to prevent the flexbox from growing past the height of the screen */}
        {/* https://stackoverflow.com/a/66689926 */}
        <div className="grow w-screen min-h-0 grid grid-rows-3 grid-cols-3">
          <div className="row-span-3 col-span-2 overflow-y-scroll pl-5 pt-3 border-r border-black">
            {puzzles.length === 0 && (
              <div className="text-2xl font-semibold">No puzzles found</div>
            )}
            {puzzles.map((puzzle, i) => (
              <Puzzle
                key={puzzle.name}
                puzzle={puzzle}
                onFunctionChangeState={(name, state) => {
                  if (!client) return;

                  if (state === FunctionState.Called) {
                    client.publish(`muddescapes/control/${puzzle.name}`, name);
                    return; // don't set function state until we receive the message
                  }

                  setPuzzles((puzzles) => {
                    const newPuzzles = [...puzzles];
                    newPuzzles[i].functions.set(name, state);
                    return newPuzzles;
                  });
                }}
              />
            ))}
          </div>
          <div className="row-span-2 border-b border-black font-mono overflow-y-scroll">
            {messages.map((message) => (
              <div key={message.time.getTime()}>
                <p className={"font-semibold"}>
                  {message.time.toLocaleString("en-US", {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                  })}{" "}
                  {message.topic}:
                </p>
                <p>{message.message}</p>
              </div>
            ))}
          </div>
          <div ref={iframeTargetRef}>
            <iframe
              className={`origin-top-left`}
              style={{
                scale: (iframeWidth && iframeHeight
                  ? Math.min(
                      iframeWidth / IFRAME_SRC_WIDTH,
                      iframeHeight / IFRAME_SRC_HEIGHT
                    )
                  : 0
                ).toString(),
                width: `${IFRAME_SRC_WIDTH}px`,
                height: `${IFRAME_SRC_HEIGHT}px`,
              }}
              src="https://muddescapes-timer.web.app/"
            ></iframe>
          </div>
        </div>
      </div>
    </>
  );
}
