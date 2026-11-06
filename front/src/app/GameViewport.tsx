import { useLayoutEffect, useRef, type PropsWithChildren } from 'react';

// All game screens share the coordinate system of the Figma artboards.
const width = 1440;
const height = 900;

export function GameViewport({ children }: PropsWithChildren) {
  const viewport = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const frame = viewport.current!;
    const surface = stage.current!;
    function fit() {
      const scale = Math.min(frame.clientWidth / width, frame.clientHeight / height);
      surface.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="game-viewport" ref={viewport}>
      <div className="game-stage" style={{ width, height }} ref={stage}>
        {children}
      </div>
    </div>
  );
}
