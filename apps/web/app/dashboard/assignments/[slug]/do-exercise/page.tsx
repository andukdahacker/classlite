import { DoExercisePage } from "@/lib/features/submission/do-exercise-page";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DoExercisePage assignmentId={slug} />;
}
