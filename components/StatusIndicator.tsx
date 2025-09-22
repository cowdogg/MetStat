import React from 'react';
import { AppStatus } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckIcon from './icons/CheckIcon';
import WarningIcon from './icons/WarningIcon';

interface StatusIndicatorProps {
    status: AppStatus;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
    const statusConfig = {
        [AppStatus.INITIALIZING]: {
            text: 'Fetching live data…',
            color: 'text-yellow-400',
            icon: <SpinnerIcon className="h-4 w-4 animate-spin" />,
        },
        [AppStatus.READY]: {
            text: 'Live Data',
            color: 'text-green-400',
            icon: <CheckIcon className="h-4 w-4" />,
        },
        [AppStatus.ERROR]: {
            text: 'API Error',
            color: 'text-red-400',
            icon: <WarningIcon className="h-4 w-4" />,
        },
    };

    const { text, color, icon } = statusConfig[status];

    return (
        <div className={`mt-2 md:mt-0 flex items-center space-x-2 text-xs ${color}`} aria-live="polite">
            {icon}
            <span>{text}</span>
        </div>
    );
};

export default StatusIndicator;
