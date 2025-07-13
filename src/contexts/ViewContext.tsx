import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { View } from '../App';

type ViewContextType = {
    view: View;
    setView: (view: View) => void;
};

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const useViewContext = () => {
    const context = useContext(ViewContext);
    if (!context) {
        throw new Error('useViewContext must be used within a ViewProvider');
    }
    return context;
};

type ViewProviderProps = {
    children: ReactNode;
};

export const ViewProvider = ({ children }: ViewProviderProps) => {
    const [view, setView] = useState<View>('chat');

    return (
        <ViewContext.Provider value={{ view, setView }}>
            {children}
        </ViewContext.Provider>
    );
};
