import { useEffect, useRef } from "react";
import { getSocket } from "@/services/socket";
import { useAuth } from "@/hooks/useAuth";
import type { Booking } from "@/services/bookingService";

type BookingEvent = "booking:created" | "booking:updated" | "booking:statusChanged" | "booking:driverAssigned";

interface Handlers {
  onCreated?: (booking: Partial<Booking>) => void;
  onUpdated?: (booking: Partial<Booking>) => void;
  onStatusChanged?: (booking: Partial<Booking> & { previousStatus?: string }) => void;
  onDriverAssigned?: (booking: Partial<Booking>) => void;
}

/**
 * Subscribe a component to the /bookings WebSocket namespace.
 * Auto-reconnects when the user changes. Returns nothing — pass handlers as the only argument.
 */
export function useBookingsRealtime(handlers: Handlers) {
  const { user } = useAuth();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!user) return;
    const socket = getSocket("/bookings");
    if (!socket) return;

    const wire = (event: BookingEvent, key: keyof Handlers) => {
      const cb = (payload: Partial<Booking>) => {
        const handler = handlersRef.current[key] as ((p: Partial<Booking>) => void) | undefined;
        handler?.(payload);
      };
      socket.on(event, cb);
      return () => socket.off(event, cb);
    };

    const unsubscribes = [
      wire("booking:created", "onCreated"),
      wire("booking:updated", "onUpdated"),
      wire("booking:statusChanged", "onStatusChanged"),
      wire("booking:driverAssigned", "onDriverAssigned"),
    ];

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [user]);
}
