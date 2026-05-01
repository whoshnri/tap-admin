import ContributionDetailPage from "./components/ContributionBody";

export default async function Page({ params }: { params: Promise<{ contributionId: string }> }) {
  const resolvedParams = await params;
  const contributionId = resolvedParams.contributionId
  
  return <ContributionDetailPage params={contributionId} />;
}
