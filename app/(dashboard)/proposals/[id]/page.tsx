import ProposalDetail from "./proposal-detail";

export default async function ProposalViewPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <ProposalDetail id={id} />;
}
