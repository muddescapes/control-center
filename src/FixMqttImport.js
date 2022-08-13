import process from "process";
import buffer from "buffer";

// https://github.com/VictorHAS/mqtt-react-hooks/issues/42#issuecomment-1089830768
window.Buffer = buffer.Buffer;
window.process = process;

export {};
