"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const PHRASES = [
  "Food Pantry",
  "Emergency Housing",
  "Financial Aid",
  "Mental Health Support",
  "Career Advising",
  "Free Tutoring",
  "Legal Help",
  "Health Insurance",
  "Menstrual Products",
  "Laptop Loans",
  "Counseling",
];

const TYPE_SPEED = 80;
const DELETE_SPEED = 40;
const PAUSE_AFTER_TYPE = 2000;
const PAUSE_AFTER_DELETE = 400;

type TypewriterPromptProps = {
  variant?: "dark" | "light";
};

export function TypewriterPrompt({ variant = "dark" }: TypewriterPromptProps) {
  const router = useRouter();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhrase = PHRASES[phraseIndex];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed === currentPhrase) {
      timeout = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPE);
    } else if (isDeleting && displayed === "") {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
      }, PAUSE_AFTER_DELETE);
    } else if (isDeleting) {
      timeout = setTimeout(() => {
        setDisplayed(currentPhrase.slice(0, displayed.length - 1));
      }, DELETE_SPEED);
    } else {
      timeout = setTimeout(() => {
        setDisplayed(currentPhrase.slice(0, displayed.length + 1));
      }, TYPE_SPEED);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, currentPhrase]);

  const handleClick = useCallback(() => {
    if (currentPhrase) {
      router.push(`/search?q=${encodeURIComponent(currentPhrase)}`);
    }
  }, [currentPhrase, router]);

  const isDark = variant === "dark";

  return (
    <div className="mt-10 text-center sm:mt-12">
      <button
        onClick={handleClick}
        className="group inline-block cursor-pointer text-left transition hover:opacity-80"
      >
        <span className={`text-xl font-medium sm:text-2xl ${isDark ? "text-white/50" : "text-slate-400"}`}>
          Help me find{" "}
        </span>
        <span className={`text-xl font-semibold sm:text-2xl ${isDark ? "text-[var(--california-gold)]" : "text-[var(--berkeley-blue)]"}`}>
          {displayed}
          <span className={`ml-0.5 inline-block w-[2px] animate-pulse ${isDark ? "bg-white/60" : "bg-[var(--california-gold)]"}`}>
            &nbsp;
          </span>
        </span>
      </button>
    </div>
  );
}
