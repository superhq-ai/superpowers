const SidebarContainer = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col relative overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 via-purple-200/20 to-pink-200/20 blur-3xl"></div>
			{children}
		</div>
	);
};

export default SidebarContainer;
