import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

const { VITE_NODE_ENV } = import.meta.env;

export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname && VITE_NODE_ENV === "production") {
      ReactGA.send({
        hitType: "pageview",
        page: location.pathname,
      });
    }
  }, [location]);
}
