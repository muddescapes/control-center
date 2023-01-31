import Image from "next/image";
import logo from "../images/muddescapes-logo.png";
import mqtt from "mqtt";
import React from "react";
import { useResizeDetector } from "react-resize-detector";
import Puzzle, { FunctionState, PuzzleData } from "../components/puzzle";

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
  const [puzzles, setPuzzles] = React.useState<PuzzleData[]>([
    {
      name: "Ashley's puzzle",
      variables: new Map([["is_solved", false]]),
      functions: new Map([["solve_puzzle", FunctionState.Idle]]),
    },
  ]);
  const [client, setClient] = React.useState<mqtt.MqttClient | null>(null);

  const iframeScale =
    iframeWidth && iframeHeight
      ? Math.min(
          iframeWidth / IFRAME_SRC_WIDTH,
          iframeHeight / IFRAME_SRC_HEIGHT
        )
      : 0.25;

  React.useEffect(() => {
    const client = mqtt.connect("wss://broker.hivemq.com:8884", {
      path: "/mqtt",
    });

    client.on("connect", () => {
      console.debug("connected");
      setIsConnected(true);
      client.subscribe("muddescapes/#");
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
            <Puzzle
              puzzle={puzzles[0]}
              onFunctionChangeState={(name, state) => {
                if (!client) return;

                if (state === FunctionState.Called) {
                  client.publish(
                    `muddescapes/${puzzles[0].name}/functions/${name}`,
                    "1"
                  );
                }

                setPuzzles((puzzles) => {
                  const newPuzzles = [...puzzles];
                  newPuzzles[0].functions.set(name, state);
                  return newPuzzles;
                });
              }}
            />
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
                scale: iframeScale.toString(),
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
