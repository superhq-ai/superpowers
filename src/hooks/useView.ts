import { useViewContext } from '../contexts/ViewContext';
import Chat from '../views/Chat';
import History from '../views/History';
import Settings from '../views/Settings';

const views = {
    chat: Chat,
    history: History,
    settings: Settings,
};

export const useView = () => {
    const { view } = useViewContext();
    return views[view];
};
