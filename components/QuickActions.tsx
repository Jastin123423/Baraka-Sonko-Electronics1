
import React from 'react';

const ACTIONS = [
  { id: 'wish', label: 'Wish List', icon: '❤️', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' },
  { id: 'whole', label: 'Wholesale', icon: '📦', bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { id: 'bargain', label: 'Bargain Zone', icon: '🏷️', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { id: 'new', label: 'New Arrival', icon: '✨', bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
  { id: 'more', label: 'Hot Deals', icon: '🔥', bg: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)' },
];

interface QuickActionsProps {
  onActionSelect: (id: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionSelect }) => {
  return (
    <div className="py-4 overflow-x-auto no-scrollbar px-3 flex space-x-6 items-start">
      {ACTIONS.map((action) => (
        <div 
          key={action.id} 
          className="flex flex-col items-center flex-shrink-0 w-[64px] group cursor-pointer"
          onClick={() => onActionSelect(action.id)}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm group-active:scale-90 transition-transform"
            style={{ background: action.bg }}
          >
            {action.icon}
          </div>
          <span className="text-[10px] font-bold text-gray-600 mt-2 text-center leading-tight whitespace-nowrap">
            {action.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default QuickActions;
