import { ExerciseEdit } from "@/lib/features/exercises/components/exercise-edit";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <ExerciseEdit id={slug} />;
}
