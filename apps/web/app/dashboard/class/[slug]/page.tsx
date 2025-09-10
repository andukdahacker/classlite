import { ClassDetails } from "@/lib/features/class/components/class-details";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <ClassDetails classId={slug} />;
}
