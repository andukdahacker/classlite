import { UserDetails } from "@/lib/features/users/components/users-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <UserDetails id={slug} />;
}
