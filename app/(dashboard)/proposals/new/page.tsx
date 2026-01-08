import CreateProposalForm from "../create-form";

export default function NewProposalPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center space-x-2">
				{/* Breadcrumbs or Back button could go here */}
			</div>
			<CreateProposalForm />
		</div>
	);
}
