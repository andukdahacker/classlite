import { AddClassMemberTable } from "@/lib/features/class/components/add-class-member-table";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="flex flex-col px-4 gap-2">
      <div className="flex justify-between flex-row items-center px-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold">Add members</span>
          <span>Assign member to class</span>
        </div>
      </div>
      <AddClassMemberTable classId={slug} />
    </div>
  );
}
