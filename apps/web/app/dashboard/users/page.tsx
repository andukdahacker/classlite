import { UsersTable } from "@/lib/features/users/components/users-table";

export default function Page() {
  return (
    <div className="flex flex-col px-4 gap-2">
      <div className="flex justify-between flex-row items-center px-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold">Users</span>
          <span>Manage your staffs, teacher and students</span>
        </div>
      </div>
      <UsersTable />
    </div>
  );
}
