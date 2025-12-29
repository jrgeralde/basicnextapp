'use client';
import React, { useEffect, useState, ReactNode } from 'react';

interface SessionTimeoutWrapperProps {
  children: ReactNode;
  timeoutMinutes: number;
  countdownSeconds: number;
  onLogout: () => Promise<void>;
}

export default function SessionTimeoutWrapper({
  children,
  timeoutMinutes,
  countdownSeconds,
  onLogout,
}: SessionTimeoutWrapperProps) {
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [showCountdown, setShowCountdown] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    const resetTimer = () => setLastActivity(Date.now());

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      const timeoutMs = timeoutMinutes * 60 * 1000;

      if (elapsed >= timeoutMs && !showCountdown) {
        setShowCountdown(true);
        setSecondsLeft(countdownSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, timeoutMinutes, countdownSeconds, showCountdown]);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    if (showCountdown) {
      countdownInterval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            onLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownInterval);
  }, [showCountdown, onLogout]);

  return (
    <>
      {children}
      {showCountdown && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/40">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center w-96">
            <p className="mb-4 text-xl font-medium">
              You have been inactive. Logging out in{"  "}
              <span className="text-red-600 font-bold text-xl">{secondsLeft}</span>{" "} seconds.             
            </p>
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {
                setShowCountdown(false);
                setLastActivity(Date.now());
              }}
            >
              Continue Session
            </button>
          </div>
        </div>
      )}
    </>
  );
}
