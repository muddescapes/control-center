import Image from "next/image";
import logo from "../images/muddescapes-logo.png";

export default function Home() {
  return (
    <>
      <div className="flex flex-row items-center outline">
        <Image src={logo} alt="MuddEscapes Logo" height={60} />
        <span className="ml-4 text-4xl font-semibold">
          MuddEscapes Control Center
        </span>
      </div>
    </>
  );
}
