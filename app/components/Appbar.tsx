"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export function Appbar() {
  const session = useSession();

  return (
    <div className="bg-black text-white p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">MuZic</h1>
        <div>
          {session.data?.user ? (
            <button
              className="m-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => signOut()}
            >
              Logout
            </button>
          ) : (
            <button
              className="m-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => signIn()}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
