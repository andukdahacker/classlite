import { ClassPage } from "@/lib/features/class/components/class-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-bold">Classes</span>
        <span>Manage your IELTS classes and schedules</span>
      </div>
      <ClassPage />
    </div>
  );
}
