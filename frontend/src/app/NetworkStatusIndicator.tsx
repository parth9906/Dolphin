import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

/**
 * Reports browser connectivity only. It does not probe the Dolphin API and
 * does not imply that edits are stored locally or synchronized.
 */
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Re-read after subscribing so a transition around mount is not missed.
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <section
      className={`network-status${
        isOnline ? " network-status--online" : " network-status--offline"
      }`}
      aria-label="Network connection status"
      aria-live="polite"
    >
      <div className="network-status__indicator">
        {isOnline ? (
          <Wifi size={16} aria-hidden="true" />
        ) : (
          <WifiOff size={16} aria-hidden="true" />
        )}
        <span>{isOnline ? "Network available" : "Offline"}</span>
      </div>

      {!isOnline && (
        <p className="network-status__warning">
          Your connection is unavailable. Unsaved form edits are not saved to
          durable local storage. Reconnect before refreshing or leaving this
          page to avoid losing them. A restored connection does not confirm
          that the Dolphin server is reachable.
        </p>
      )}
    </section>
  );
}
