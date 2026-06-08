import CalendarPreview from "../components/dashboard/CalendarPreview";
import WeeklySchedule from "../components/dashboard/WeeklySchedule";

export default function CalendarScreen({ app }) {
  return (
    <div className="space-y-4">
      <CalendarPreview app={app} />
      <WeeklySchedule app={app} />
    </div>
  );
}