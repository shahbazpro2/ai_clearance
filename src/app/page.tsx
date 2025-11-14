"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleEmailLogin = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}
