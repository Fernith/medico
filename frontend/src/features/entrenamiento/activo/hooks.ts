import { useEffect, useRef } from "react";

export function useBackgroundTimer(
  callback: () => void,
  isActive: boolean,
  intervalMs: number = 250,
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive) return;

    let animationFrameId: number;

    const loop = () => {
      savedCallback.current();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    const blob = new Blob(
      [
        `
      let intervalId = null;
      self.onmessage = function(e) {
        if (e.data.command === 'start') {
          intervalId = setInterval(() => self.postMessage('tick'), e.data.interval);
        } else if (e.data.command === 'stop') {
          clearInterval(intervalId);
        }
      };
    `,
      ],
      { type: "application/javascript" },
    );

    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = () => {
      if (document.hidden) {
        savedCallback.current();
      }
    };

    worker.postMessage({ command: "start", interval: intervalMs });

    return () => {
      cancelAnimationFrame(animationFrameId);
      worker.postMessage({ command: "stop" });
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, [isActive, intervalMs]);
}