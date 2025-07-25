"use client";
import { Appbar } from "./components/Appbar";
import { Redirect } from "./components/Redirect";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Appbar />
      <Redirect/>
      <section className="flex flex-col items-center justify-center text-center mt-20 px-6">
        <h1 className="text-5xl font-bold mb-6">Welcome to MuZic Stream</h1>
        <p className="text-lg max-w-2xl mb-8">
          A new way for creators to let their fans choose what music plays during the stream. Engage, interact, and vibe together in real time.
        </p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded">
          Get Started
        </button>
      </section>
    </main>
  );
}
