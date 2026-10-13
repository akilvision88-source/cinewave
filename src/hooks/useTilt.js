// src/hooks/useTilt.js
import { useRef, useState, useCallback } from 'react';

export const useTilt = ({ maxTilt = 12, scale = 1.03 } = {}) => {
  const ref = useRef(null);
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
  });

  const handleMouseMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setStyle({
        transform: `perspective(1000px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg) scale(${scale})`,
        transition: 'transform 0.1s ease-out',
      });
    },
    [maxTilt, scale]
  );

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
    });
  }, []);

  return { ref, style, handleMouseMove, handleMouseLeave };
};