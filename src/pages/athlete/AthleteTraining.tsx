import { useNavigate } from "react-router-dom";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import DailyTrainingHub from "@/components/athlete/DailyTrainingHub";

export default function AthleteTraining() {
  const navigate = useNavigate();
  return (
    <AthleteLayout>
      <DailyTrainingHub
        onStart={() => navigate("/athlete/workout/active")}
        onPhaseClick={() => navigate("/athlete/workout/active")}
      />
    </AthleteLayout>
  );
}
