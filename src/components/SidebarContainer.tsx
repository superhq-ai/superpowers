const SidebarContainer = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="h-screen w-full bg-[var(--surface)] text-[var(--text-dark)] flex flex-col relative overflow-hidden">
			{children}
		</div>
	);
};

export default SidebarContainer;
