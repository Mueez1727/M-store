// src/components/ScrollToTop.js
import { useEffect } from "react";

export function ScrollToTop({ trigger }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [trigger]);
  
  return null;
}