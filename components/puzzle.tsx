import ellipsis from "../images/ellipsis.svg";
import checkmark from "../images/checkmark.svg";
import Image from "next/image";

export enum FunctionState {
  Idle,
  Called,
  Completed,
}

export interface PuzzleData {
  name: string;
  variables: Map<string, boolean>;
  functions: Map<string, FunctionState>;
}

function Variable({ name, value }: { name: string; value: boolean }) {
  return (
    <span className="p-2 bg-gray-200 rounded-md">
      <span>{name}</span>
      <span
        className={
          "p-1 ml-2 rounded-md " + (value ? "bg-green-400" : "bg-red-400")
        }
      >
        {value ? "TRUE" : "FALSE"}
      </span>
    </span>
  );
}

function Function({
  name,
  state,
  onFunctionChangeState,
}: {
  name: string;
  state: FunctionState;
  onFunctionChangeState: (name: string, state: FunctionState) => void;
}) {
  let icon = null;
  switch (state) {
    case FunctionState.Called:
      icon = (
        <span className="absolute flex justify-center align-middle -top-2 -right-2 rounded-full bg-black w-5 h-5">
          <Image className="w-2.5" src={ellipsis} alt="..." />
        </span>
      );
      break;
    case FunctionState.Completed:
      icon = (
        <span
          className="animate-fade absolute flex justify-center align-middle -top-2 -right-2 rounded-full bg-green-500 w-5 h-5"
          onAnimationEnd={() => onFunctionChangeState(name, FunctionState.Idle)}
        >
          <Image className="w-2.5" src={checkmark} alt="checkmark" />
        </span>
      );
      break;
  }

  return (
    <button
      className="relative p-2 bg-blue-500 rounded-xl text-white transition hover:bg-blue-600"
      onClick={() => onFunctionChangeState(name, FunctionState.Called)}
    >
      {name}
      {icon}
    </button>
  );
}

export default function Puzzle({
  puzzle,
  onFunctionChangeState,
}: {
  puzzle: PuzzleData;
  onFunctionChangeState: (name: string, state: FunctionState) => void;
}) {
  return (
    <div>
      <h1 className="text-3xl text-primary">{puzzle.name}</h1>
      <div>
        <h2 className="my-2 text-xl">Variables</h2>
        {Array.from(puzzle.variables.entries()).map(([name, value]) => (
          <Variable key={name} name={name} value={value} />
        ))}
      </div>
      <div>
        <h2 className="my-2 text-xl">Functions</h2>
        {Array.from(puzzle.functions.entries()).map(([name, state]) => (
          <Function
            key={name}
            name={name}
            state={state}
            onFunctionChangeState={onFunctionChangeState}
          />
        ))}
      </div>
    </div>
  );
}
