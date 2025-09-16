import { ExercisePreviewPage } from "@/lib/features/exercises/components/preview/exercise-preview-page";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <ExercisePreviewPage id={slug} />;
}
