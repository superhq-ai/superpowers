import { History, Settings2Icon, ArrowLeft, Plus } from 'lucide-react';
import { useViewContext } from '../contexts/ViewContext';
import { useConversationStore } from '../lib/store';

export default function SidebarHeader() {
    const { view, setView } = useViewContext();
    const { startNewConversation, setValidationError } = useConversationStore();

    const handleNewChat = () => {
        startNewConversation();
        setValidationError(null);
        setView('chat');
    };

    return (
        <div className="relative z-10 p-4">
            <div className="flex items-center justify-between gap-2">
                {view === 'chat' ? (
                    <button
                        className='inline-flex gap-1 items-center justify-center group p-1 rounded-sm hover:bg-gray-200 transition-colors'
                        title="New chat"
                        onClick={handleNewChat}
                    >
                        <Plus className="w-4 h-4 text-gray-600" strokeWidth={2.25} />
                        <span className='font-semibold text-gray-600'>New</span>
                    </button>
                ) : (
                    <button
                        className='flex items-center justify-center group p-1 rounded-sm hover:bg-gray-200 transition-colors'
                        title="Back to chat"
                        onClick={() => setView('chat')}
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-600" strokeWidth={2.25} />
                    </button>
                )}
                <div className="flex items-center gap-4">
                    <button className='flex items-center justify-center group p-1 rounded-sm hover:bg-gray-200 transition-colors' title="History" onClick={() => setView('history')}>
                        <History className="w-4 h-4 text-gray-600" strokeWidth={2.25} />
                    </button>
                    <button className='flex items-center justify-center group p-1 rounded-sm hover:bg-gray-200 transition-colors' title="Settings" onClick={() => setView('settings')}>
                        <Settings2Icon className="w-4 h-4 text-gray-600" strokeWidth={2.25} />
                    </button>
                </div>
            </div>
        </div>
    )
}
