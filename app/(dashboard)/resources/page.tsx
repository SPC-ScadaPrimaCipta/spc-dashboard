"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceModal } from "@/components/resources/resource-modal";
import { DeleteResourceModal } from "@/components/resources/delete-resource-modal";
import { ResourceCard } from "@/components/resources/resource-card";
import { ScheduleResource, ResourceType } from "@/components/resources/types";

export default function ResourcesPage() {
	const [resources, setResources] = useState<ScheduleResource[]>([]);
	const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [selectedResource, setSelectedResource] =
		useState<ScheduleResource | null>(null);

	// Tabs: defaults to "ROOM", could also be "PEOPLE" or "VEHICLE"
	const [activeTab, setActiveTab] = useState<string>("ROOM");

	// Active selected resource type for modal creation constraint based on active Tab
	const activeResourceType = useMemo(() => {
		const type = resourceTypes.find((rt) => rt.code === activeTab);
		if (!type && activeTab === "PERSON") {
			return resourceTypes.find((rt) => rt.code === "PEOPLE");
		}
		return type;
	}, [resourceTypes, activeTab]);

	const loadData = async () => {
		setIsLoading(true);
		try {
			const [resR, resT] = await Promise.all([
				fetch("/api/schedule/resources"),
				fetch("/api/resource-types"),
			]);
			const jsonR = await resR.json();
			const jsonT = await resT.json();

			if (jsonR.ok) setResources(jsonR.data);
			if (jsonT.ok) setResourceTypes(jsonT.data);
		} catch (error) {
			console.error("Failed to fetch data", error);
			toast.error("Failed to load resources");
		}
		setIsLoading(false);
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleAdd = () => {
		setSelectedResource(null);
		setIsModalOpen(true);
	};

	const handleEdit = (resource: ScheduleResource) => {
		setSelectedResource(resource);
		setIsModalOpen(true);
	};

	const handleDelete = (resource: ScheduleResource) => {
		setSelectedResource(resource);
		setIsDeleteOpen(true);
	};

	// Split data by tab
	const roomResources = resources.filter(
		(r) => r.resourceType?.code === "ROOM",
	);
	const peopleResources = resources.filter(
		(r) =>
			r.resourceType?.code === "PERSON" ||
			r.resourceType?.code === "PEOPLE",
	); // Sometimes people use PERSON or PEOPLE interchangeably in DB
	const vehicleResources = resources.filter(
		(r) => r.resourceType?.code === "VEHICLE",
	);

	// Handle standard tabs
	const renderContent = (typeCode: string, items: ScheduleResource[]) => {
		if (isLoading) {
			return (
				<div className="flex h-[30vh] w-full items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			);
		}

		// CARD STYLE
		if (items.length === 0) {
			return (
				<div className="flex h-[20vh] w-full items-center justify-center border rounded-md border-dashed text-muted-foreground">
					No {typeCode.toLowerCase()} resources found.
				</div>
			);
		}

		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{items.map((r) => (
					<ResourceCard
						key={r.id}
						resource={r}
						typeCode={typeCode}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				))}
			</div>
		);
	};

	return (
		<div className="h-full flex flex-col gap-6">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Resources
					</h1>
					<p className="text-muted-foreground">
						Manage your schedule resources
					</p>
				</div>
				<Button onClick={handleAdd}>
					<Plus className="mr-2 h-4 w-4" /> Add Resource
				</Button>
			</header>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="flex-1 w-full flex flex-col gap-6"
			>
				<TabsList>
					<TabsTrigger value="ROOM">Room</TabsTrigger>
					<TabsTrigger value="PERSON">People</TabsTrigger>
					<TabsTrigger value="VEHICLE">Vehicle</TabsTrigger>
				</TabsList>
				<TabsContent
					value="ROOM"
					className="m-0 border-none p-0 outline-none flex-1 overflow-auto"
				>
					{renderContent("ROOM", roomResources)}
				</TabsContent>
				<TabsContent
					value="PERSON"
					className="m-0 border-none p-0 outline-none flex-1 overflow-auto"
				>
					{renderContent("PERSON", peopleResources)}
				</TabsContent>
				<TabsContent
					value="VEHICLE"
					className="m-0 border-none p-0 outline-none flex-1 overflow-auto"
				>
					{renderContent("VEHICLE", vehicleResources)}
				</TabsContent>
			</Tabs>

			{/* Use fallback to people if missing to prevent crash if not perfectly hydrated */}
			{activeResourceType && (
				<ResourceModal
					isOpen={isModalOpen}
					setIsOpen={setIsModalOpen}
					resource={selectedResource}
					resourceType={activeResourceType}
					onSuccess={loadData}
					toast={toast}
				/>
			)}

			<DeleteResourceModal
				isOpen={isDeleteOpen}
				setIsOpen={setIsDeleteOpen}
				resource={selectedResource}
				onSuccess={loadData}
				toast={toast}
			/>
		</div>
	);
}
