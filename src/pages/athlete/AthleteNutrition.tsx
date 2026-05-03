import { useNavigate } from "react-router-dom";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import DailyNutritionLog from "@/components/athlete/DailyNutritionLog";

export default function AthleteNutrition() {
  const navigate = useNavigate();
  return (
    <AthleteLayout>
      <DailyNutritionLog onAddMeal={() => navigate("/athlete/copilot")} />
    </AthleteLayout>
  );
}
