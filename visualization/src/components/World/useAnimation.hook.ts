import { useRef } from 'react';
import useAnimationFrame from 'use-animation-frame/index';

export const useAnimation = (cb, fps = 60) => {
  const timeSinceLastFrameRef = useRef(0);
  useAnimationFrame(e => {
    if (timeSinceLastFrameRef.current > (1 / fps)) {
      cb({ ...e, sinceLastFrame: timeSinceLastFrameRef.current });
      timeSinceLastFrameRef.current = 0;
    } else {
      timeSinceLastFrameRef.current += e.delta;
    }
  });
};
