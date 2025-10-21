import { AssignmentDetails } from "@/lib/features/assignments/assignment-details";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AssignmentDetails id={slug} />;
}
