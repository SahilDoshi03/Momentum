import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem, DropdownHeader } from '@/components/ui/Dropdown';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { CheckCircle, Plus, Trash } from '@/components/icons';
import { Task, User as UserType, Project, apiClient } from '@/lib/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    project: Project;
    currentUser: UserType | null;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    isOpen,
    onClose,
    task,
    project,
    currentUser,
    onUpdateTask,
    onDeleteTask,
}) => {
    const [name, setName] = useState(task.name);
    const [description, setDescription] = useState(task.description || '');
    const [dueDate, setDueDate] = useState(task.dueDate);
    const [complete, setComplete] = useState(task.complete);
    const [assigned, setAssigned] = useState(task.assigned || []);
    const [labels, setLabels] = useState(task.labels || []);

    // Sync state with task prop when it changes
    useEffect(() => {
        setName(task.name);
        setDescription(task.description || '');
        setDueDate(task.dueDate);
        setComplete(task.complete);
        setAssigned(task.assigned || []);
        setLabels(task.labels || []);
    }, [task]);

    const handleSave = async () => {
        try {
            const updates: Partial<Task> = {};
            let hasUpdates = false;

            // Check for scalar updates
            if (name.trim() !== task.name) {
                updates.name = name.trim();
                hasUpdates = true;
            }
            if (description !== (task.description || '')) {
                updates.description = description;
                hasUpdates = true;
            }
            if (dueDate !== task.dueDate) {
                updates.dueDate = dueDate;
                hasUpdates = true;
            }
            if (complete !== task.complete) {
                updates.complete = complete;
                hasUpdates = true;
            }

            // Apply scalar updates
            if (hasUpdates) {
                await apiClient.updateTask(task._id, updates);
            }

            // Handle Assignments
            const originalAssignedIds = new Set(task.assigned?.map(a => a.userId._id) || []);
            const currentAssignedIds = new Set(assigned.map(a => a.userId._id));

            // Added assignments
            for (const a of assigned) {
                if (!originalAssignedIds.has(a.userId._id)) {
                    await apiClient.assignUserToTask(task._id, a.userId._id);
                }
            }

            // Removed assignments
            for (const a of task.assigned || []) {
                if (!currentAssignedIds.has(a.userId._id)) {
                    await apiClient.unassignUserFromTask(task._id, a.userId._id);
                }
            }

            // Handle Labels
            const originalLabelIds = new Set(task.labels?.map(l => l.projectLabelId._id) || []);
            const currentLabelIds = new Set(labels.map(l => l.projectLabelId._id));

            // Added labels
            for (const l of labels) {
                if (!originalLabelIds.has(l.projectLabelId._id)) {
                    await apiClient.addLabelToTask(task._id, l.projectLabelId._id);
                }
            }

            // Removed labels
            for (const l of task.labels || []) {
                if (!currentLabelIds.has(l.projectLabelId._id)) {
                    await apiClient.removeLabelFromTask(task._id, l._id);
                }
            }

            // Notify parent to update UI (or reload)
            onUpdateTask(task._id, {
                ...updates,
                assigned,
                labels
            });

            toast.success('Task saved successfully');
            onClose();
        } catch (error) {
            console.error('Failed to save task:', error);
            toast.error('Failed to save task');
        }
    };

    const handleToggleComplete = () => {
        setComplete(!complete);
    };

    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDueDate(e.target.value);
    };

    const handleAssignUser = (userId: string) => {
        const user = project.members?.find(m => m.userId._id === userId)?.userId;
        if (user) {
            const newAssignment = {
                _id: 'temp-' + Date.now(), // Temp ID
                userId: user,
                assignedDate: new Date().toISOString()
            };
            setAssigned([...assigned, newAssignment]);
        }
    };

    const handleUnassignUser = (userId: string) => {
        setAssigned(assigned.filter(a => a.userId._id !== userId));
    };

    const handleAddLabel = (labelId: string) => {
        const label = project.labels?.find(l => l._id === labelId);
        if (label) {
            const newLabel = {
                _id: 'temp-' + Date.now(),
                projectLabelId: label,
                assignedDate: new Date().toISOString()
            };
            setLabels([...labels, newLabel]);
        }
    };

    const handleRemoveLabel = (projectLabelId: string) => {
        setLabels(labels.filter(l => l.projectLabelId._id !== projectLabelId));
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            onDeleteTask(task._id);
            onClose();
        }
    };

    // Get users from project members
    const projectUsers = project.members?.map(m => m.userId) || [];

    // Get list name
    const getListName = () => {
        if (typeof task.taskGroupId === 'object' && task.taskGroupId !== null) {
            return (task.taskGroupId as any).name;
        }
        // Try to find in project task groups
        const group = project.taskGroups?.find(g => g._id === task.taskGroupId);
        return group ? group.name : 'Unknown List';
    };

    const footer = (
        <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={onClose}>
                Cancel
            </Button>
            <Button onClick={handleSave}>
                Save Changes
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden"
            footer={footer}
            showCloseButton={true}
        >
            <div className="flex flex-1 overflow-hidden h-full">
                {/* Main Content */}
                <div className="flex-1 p-8 overflow-y-auto border-r border-[var(--border)]">
                    {/* Title */}
                    <div className="mb-6">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full text-2xl font-bold bg-transparent border-none outline-none text-[var(--text-secondary)] placeholder-[var(--text-tertiary)]"
                            placeholder="Task Title"
                        />
                        <div className="text-sm text-[var(--text-tertiary)] mt-1">
                            in list <span className="font-medium text-[var(--text-primary)]">{getListName()}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Description</h3>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full min-h-[150px] p-3 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none resize-y"
                            placeholder="Add a more detailed description..."
                        />
                    </div>

                    {/* Metadata (Created/Updated By) */}
                    <div className="flex items-center space-x-6 text-sm text-[var(--text-tertiary)] border-t border-[var(--border)] pt-6">
                        <div className="flex items-center">
                            <span className="mr-2">Created by:</span>
                            {task.createdBy ? (
                                <div className="flex items-center text-[var(--text-primary)]">
                                    <ProfileIcon user={task.createdBy} size="xs" className="mr-2" />
                                    {task.createdBy.fullName}
                                </div>
                            ) : (
                                <span>Unknown</span>
                            )}
                        </div>
                        <div className="flex items-center">
                            <span className="mr-2">Last updated by:</span>
                            {task.updatedBy ? (
                                <div className="flex items-center text-[var(--text-primary)]">
                                    <ProfileIcon user={task.updatedBy} size="xs" className="mr-2" />
                                    {task.updatedBy.fullName}
                                </div>
                            ) : (
                                <span>Unknown</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 pl-6 overflow-y-auto flex flex-col">
                    <div className="flex-1">
                        {/* Status */}
                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Status</h3>
                            <Button
                                variant={complete ? "success" : "outline"}
                                className="w-full justify-start"
                                onClick={handleToggleComplete}
                            >
                                <CheckCircle width={16} height={16} className="mr-2" />
                                {complete ? 'Completed' : 'Mark Complete'}
                            </Button>
                        </div>

                        {/* Assignees */}
                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Assignees</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {assigned.map((assignment) => (
                                    <div key={assignment._id} className="flex items-center bg-[var(--bg-primary)] rounded-full pl-1 pr-3 py-1 border border-[var(--border)]">
                                        <ProfileIcon user={assignment.userId} size="xs" className="mr-2" />
                                        <span className="text-sm text-[var(--text-primary)] mr-2">{assignment.userId.fullName}</span>
                                        <button
                                            onClick={() => handleUnassignUser(assignment.userId._id)}
                                            className="text-[var(--text-tertiary)] hover:text-[var(--danger)]"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <Dropdown
                                    trigger={
                                        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                                            <Plus width={16} height={16} />
                                        </button>
                                    }
                                >
                                    <DropdownHeader>Assign Member</DropdownHeader>
                                    {(() => {
                                        const availableUsers = projectUsers.filter(user => !assigned.some(a => a.userId._id === user._id));

                                        if (availableUsers.length === 0) {
                                            return (
                                                <div className="px-4 py-2 text-sm text-[var(--text-tertiary)]">
                                                    No members to assign
                                                </div>
                                            );
                                        }

                                        return availableUsers.map(user => (
                                            <DropdownItem
                                                key={user._id}
                                                onClick={() => handleAssignUser(user._id)}
                                            >
                                                <div className="flex items-center">
                                                    <ProfileIcon user={user} size="xs" className="mr-2" />
                                                    {user.fullName}
                                                </div>
                                            </DropdownItem>
                                        ));
                                    })()}
                                </Dropdown>
                            </div>
                        </div>

                        {/* Labels */}
                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Labels</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {labels.map((label) => (
                                    <div
                                        key={label._id}
                                        className="flex items-center px-2 py-1 rounded text-xs text-white cursor-pointer hover:opacity-80"
                                        style={{ backgroundColor: label.projectLabelId.labelColorId.colorHex }}
                                        onClick={() => handleRemoveLabel(label.projectLabelId._id)}
                                        title="Click to remove"
                                    >
                                        {label.projectLabelId.name}
                                    </div>
                                ))}
                                <Dropdown
                                    trigger={
                                        <button className="flex items-center justify-center w-8 h-8 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                                            <Plus width={16} height={16} />
                                        </button>
                                    }
                                >
                                    <DropdownHeader>Add Label</DropdownHeader>
                                    {project.labels && project.labels.length > 0 ? (
                                        project.labels.map(label => {
                                            const isAssigned = labels.some(l => l.projectLabelId._id === label._id);
                                            return (
                                                <DropdownItem
                                                    key={label._id}
                                                    onClick={() => !isAssigned && handleAddLabel(label._id)}
                                                    className={isAssigned ? 'opacity-50 cursor-default' : ''}
                                                >
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-3 h-3 rounded-full mr-2"
                                                            style={{ backgroundColor: label.labelColorId.colorHex }}
                                                        />
                                                        {label.name}
                                                        {isAssigned && <CheckCircle width={12} height={12} className="ml-auto text-[var(--success)]" />}
                                                    </div>
                                                </DropdownItem>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-2 text-sm text-[var(--text-tertiary)]">
                                            No labels in project
                                        </div>
                                    )}
                                </Dropdown>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Due Date</h3>
                            <input
                                type="date"
                                value={dueDate ? dayjs(dueDate).format('YYYY-MM-DD') : ''}
                                onChange={handleDueDateChange}
                                className="w-full p-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
                            />
                        </div>

                        {/* Delete Action */}
                        <div className="mt-auto pt-4 border-t border-[var(--border)]">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                                onClick={handleDelete}
                            >
                                <Trash width={16} height={16} className="mr-2" />
                                Delete Task
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
