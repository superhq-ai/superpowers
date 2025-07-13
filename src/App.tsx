import SidebarContainer from './components/SidebarContainer';
import SidebarHeader from './components/SidebarHeader';
import { useView } from './hooks/useView';
import ViewContainer from './components/ViewContainer';
import { ViewProvider } from './contexts/ViewContext';

export type View = 'chat' | 'history' | 'settings';

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
}

const App = () => {
  return (
    <ViewProvider>
      <AppContent />
    </ViewProvider>
  )
};

export default App;
