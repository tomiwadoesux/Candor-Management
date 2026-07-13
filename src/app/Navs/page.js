import Header from "@/components/header";
import InNav from "@/components/InNav";
import Head from "next/head";

export default function Navs() {
  return (
    <div className="bg-white min-h-screen w-full">
      {" "}
      <Header />
      <InNav/>
    </div>
  );
}
