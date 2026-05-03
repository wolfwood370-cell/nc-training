import { useNavigate } from "react-router-dom";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import CopilotMacroIntervention from "@/components/athlete/CopilotMacroIntervention";

export default function AthleteCopilot() {
  const navigate = useNavigate();
  return (
    <AthleteLayout>
      <CopilotMacroIntervention
        onClose={() => navigate("/athlete/nutrition")}
        onLogMeal={() => navigate("/athlete/nutrition")}
      />
    </AthleteLayout>
  );
}
