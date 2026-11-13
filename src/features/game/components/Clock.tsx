import { useClock } from "../hooks/useClock";
import { formatClock } from "@/features/game/utils/time-formatter";
import { ClockFace } from "./ClockFace";

const Clock = ({
  startingTime,
  isActive,
  onTimeout,
  gameEnded = false,
  serverTimeLeft,
}: {
  startingTime: number;
  isActive: boolean;
  onTimeout?: () => void;
  gameEnded?: boolean;
  serverTimeLeft?: number; // Time from server in milliseconds
}) => {
  const { time, isLowTime } = useClock({
    startingTime,
    isActive,
    onTimeout,
    gameEnded,
    serverTimeLeft,
  });

  return (
    <ClockFace active={isActive} lowTime={isLowTime}>
      {formatClock(time)}
    </ClockFace>
  );
};

export default Clock;
