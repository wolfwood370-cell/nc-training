import { useNavigate } from "react-router-dom";
import ActiveWorkoutHub from "@/components/athlete/ActiveWorkoutHub";

export default function ActiveWorkout() {
  const navigate = useNavigate();
  return (
    <ActiveWorkoutHub
      onClose={() => navigate("/athlete/workout")}
      onFinish={() => navigate("/athlete/workout")}
    />
  );
}
