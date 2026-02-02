import React from 'react';
import { Skeleton } from './ui/Skeleton';

export const ProjectBoardSkeleton: React.FC = () => {
    return (
        <div className="flex-1 p-6 h-full flex flex-col">
            {/* Board Header Skeleton */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <Skeleton width={250} height={32} />
                    <Skeleton width={32} height={32} borderRadius="9999px" />
                </div>

                {/* Controls Toolbar Skeleton */}
                <div className="flex items-center gap-2">
                    <Skeleton width={120} height={32} />
                    <div className="w-px h-6 bg-[var(--border)] mx-1" />
                    <Skeleton width={80} height={32} />
                    <Skeleton width={80} height={32} />
                    <Skeleton width={150} height={32} />
                </div>
            </div>

            {/* Kanban Board Skeleton */}
            <div className="flex-1 flex gap-6 overflow-x-hidden min-h-0">
                {[1, 2, 3].map((column) => (
                    <div key={column} className="w-80 flex-shrink-0 flex flex-col h-full">
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 px-2">
                            <Skeleton width={100} height={20} />
                            <div className="flex gap-2">
                                <Skeleton width={20} height={20} />
                                <Skeleton width={20} height={20} />
                            </div>
                        </div>

                        {/* Column Tasks */}
                        <div className="flex-col gap-3 flex">
                            {[1, 2, 3, 4].map((task) => (
                                <div key={task} className="p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg space-y-3">
                                    {/* Labels at top */}
                                    <div className="flex gap-1 mb-2">
                                        <Skeleton width={40} height={12} borderRadius="4px" />
                                        <Skeleton width={40} height={12} borderRadius="4px" />
                                    </div>

                                    {/* Task Name */}
                                    <Skeleton width="90%" height={16} />

                                    {/* Footer */}
                                    <div className="flex justify-between items-center pt-2 mt-3">
                                        <div className="flex items-center gap-2">
                                            {/* Assignee pulse */}
                                            <Skeleton width={24} height={24} borderRadius="9999px" />
                                            {/* Due Date pulse */}
                                            <Skeleton width={50} height={14} borderRadius="4px" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Skeleton width={16} height={16} borderRadius="4px" />
                                            <Skeleton width={16} height={16} borderRadius="4px" />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add Task Button Skeleton */}
                            <Skeleton width="100%" height={40} className="mt-2" />
                        </div>
                    </div>
                ))}

                {/* Add List Button Skeleton */}
                <div className="w-80 flex-shrink-0 h-10">
                    <Skeleton width="100%" height="100%" className="rounded-lg" />
                </div>
            </div>
        </div>
    );
};
