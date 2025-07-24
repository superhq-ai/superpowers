import SidebarContainer from "./components/SidebarContainer";
import SidebarHeader from "./components/SidebarHeader";
import ViewContainer from "./components/ViewContainer";
import { AppSettingsProvider } from "./contexts/AppSettingsContext";
import { TabContextProvider } from "./contexts/TabContext";
import { ViewProvider } from "./contexts/ViewContext";
import { useView } from "./hooks/useView";

export type View = "chat" | "history" | "settings";

const AppContent = () => {
	const CurrentView = useView();

	return (
		<SidebarContainer>
			<SidebarHeader />
			<ViewContainer>
				<CurrentView />
			</ViewContainer>
		</SidebarContainer>
	);
};

const App = () => {
	return (
		<AppSettingsProvider>
			<ViewProvider>
				<TabContextProvider>
					<AppContent />
					<div id="portal-root" />
				</TabContextProvider>
			</ViewProvider>
		</AppSettingsProvider>
	);
};

export default App;
