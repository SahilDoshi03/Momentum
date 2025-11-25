import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem, DropdownHeader } from '@/components/ui/Dropdown';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { CheckCircle, Tags, User, Trash, Plus } from '@/components/icons';
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
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [users, setUsers] = useState<UserType[]>([]);

    useEffect(() => {
        setName(task.name);
        setDescription(task.description || '');
    }, [task]);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await apiClient.getUsers();
                if (response.success && response.data) {
                    setUsers(response.data);
                }
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        };
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const handleNameBlur = () => {
        if (name.trim() !== task.name) {
            onUpdateTask(task._id, { name: name.trim() });
        }
    };

    const handleDescriptionSave = () => {
        if (description !== task.description) {
            onUpdateTask(task._id, { description });
        }
        setIsEditingDesc(false);
    };

    const handleToggleComplete = () => {
        onUpdateTask(task._id, { complete: !task.complete });
    };

    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateTask(task._id, { dueDate: e.target.value });
    };

    const handleAssignUser = async (userId: string) => {
        try {
            await apiClient.assignUserToTask(task._id, userId);
            // Optimistic update or refetch would be ideal here, but for now we rely on parent update
            // We need to manually trigger the update in parent because assignUserToTask returns void/success
            // So we might need to reload the task or manually update the local state passed down
            // For simplicity, we'll assume the parent refreshes or we construct the new state
            const user = users.find(u => u._id === userId);
            if (user) {
                const newAssigned = [...(task.assigned || []), { _id: 'temp', userId: user, assignedDate: new Date().toISOString() }];
                onUpdateTask(task._id, { assigned: newAssigned } as unknown as Partial<Task>);
            }
        } catch (error) {
            console.error('Failed to assign user:', error);
            toast.error('Failed to assign user');
        }
    };

    const handleUnassignUser = async (userId: string) => {
        try {
            await apiClient.unassignUserFromTask(task._id, userId);
            const newAssigned = (task.assigned || []).filter(a => a.userId._id !== userId);
            onUpdateTask(task._id, { assigned: newAssigned } as unknown as Partial<Task>);
        } catch (error) {
            console.error('Failed to unassign user:', error);
            toast.error('Failed to unassign user');
        }
    };

    const handleAddLabel = async (labelId: string) => {
        try {
            await apiClient.addLabelToTask(task._id, labelId);
            const label = project.labels?.find(l => l._id === labelId);
            if (label) {
                const newLabels = [...(task.labels || []), { _id: 'temp', projectLabelId: label, assignedDate: new Date().toISOString() }];
                onUpdateTask(task._id, { labels: newLabels } as unknown as Partial<Task>);
            }
        } catch (error) {
            console.error('Failed to add label:', error);
            toast.error('Failed to add label');
        }
    };

    const handleRemoveLabel = async (labelId: string) => {
        // We need the assignment ID (the ID in the labels array), not the projectLabelId
        // But the API expects labelId (which seems to be the assignment ID based on api.ts removeLabelFromTask signature? 
        // Wait, api.ts says removeLabelFromTask(taskId, labelId). Let's assume it means the projectLabelId or the assignment ID.
        // Looking at api.ts: delete `/tasks/${taskId}/labels/${labelId}`. Usually this is the assignment ID.
        // Let's find the assignment ID.
        const assignment = task.labels?.find(l => l.projectLabelId._id === labelId);
        if (assignment) {
            try {
                await apiClient.removeLabelFromTask(task._id, assignment._id); // Use assignment ID if possible, or try labelId if backend is smart
                const newLabels = (task.labels || []).filter(l => l.projectLabelId._id !== labelId);
                onUpdateTask(task._id, { labels: newLabels } as unknown as Partial<Task>);
            } catch (error) {
                console.error('Failed to remove label:', error);
                toast.error('Failed to remove label');
            }
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            onDeleteTask(task._id);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
            {/* Header Image/Banner could go here */}

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 p-8 overflow-y-auto border-r border-[var(--border)]">
                    {/* Title */}
                    <div className="mb-6">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleNameBlur}
                            className="w-full text-2xl font-bold bg-transparent border-none outline-none text-[var(--text-secondary)] placeholder-[var(--text-tertiary)]"
                            placeholder="Task Title"
                        />
                        <div className="text-sm text-[var(--text-tertiary)] mt-1">
                            in list <span className="font-medium text-[var(--text-primary)]">{typeof task.taskGroupId === 'object' ? task.taskGroupId.name : '...'}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Description</h3>
                            {!isEditingDesc && description && (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(true)}>Edit</Button>
                            )}
                        </div>

                        {isEditingDesc ? (
                            <div className="space-y-2">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full min-h-[150px] p-3 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none resize-y"
                                    placeholder="Add a more detailed description..."
                                    autoFocus
                                />
                                <div className="flex space-x-2">
                                    <Button size="sm" onClick={handleDescriptionSave}>Save</Button>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setDescription(task.description || '');
                                        setIsEditingDesc(false);
                                    }}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="prose dark:prose-invert max-w-none text-[var(--text-primary)] min-h-[60px] cursor-pointer hover:bg-[var(--bg-secondary)] p-2 -ml-2 rounded"
                                onClick={() => setIsEditingDesc(true)}
                            >
                                {description ? (
                                    <p className="whitespace-pre-wrap">{description}</p>
                                ) : (
                                    <p className="text-[var(--text-tertiary)] italic">Add a more detailed description...</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Checklists could go here */}

                    {/* Comments could go here */}
                </div>

                {/* Sidebar */}
                <div className="w-80 bg-[var(--bg-secondary)] p-6 overflow-y-auto">
                    {/* Status */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Status</h3>
                        <Button
                            variant={task.complete ? "success" : "outline"}
                            className="w-full justify-start"
                            onClick={handleToggleComplete}
                        >
                            <CheckCircle width={16} height={16} className="mr-2" />
                            {task.complete ? 'Completed' : 'Mark Complete'}
                        </Button>
                    </div>

                    {/* Assignees */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Assignees</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {task.assigned?.map((assignment) => (
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
                                {users.map(user => {
                                    const isAssigned = task.assigned?.some(a => a.userId._id === user._id);
                                    return (
                                        <DropdownItem
                                            key={user._id}
                                            onClick={() => !isAssigned && handleAssignUser(user._id)}
                                            className={isAssigned ? 'opacity-50 cursor-default' : ''}
                                        >
                                            <div className="flex items-center">
                                                <ProfileIcon user={user} size="xs" className="mr-2" />
                                                {user.fullName}
                                                {isAssigned && <CheckCircle width={12} height={12} className="ml-auto text-[var(--success)]" />}
                                            </div>
                                        </DropdownItem>
                                    );
                                })}
                            </Dropdown>
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Labels</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {task.labels?.map((label) => (
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
                                {project.labels?.map(label => {
                                    const isAssigned = task.labels?.some(l => l.projectLabelId._id === label._id);
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
                                })}
                            </Dropdown>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Due Date</h3>
                        <input
                            type="date"
                            value={task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : ''}
                            onChange={handleDueDateChange}
                            className="w-full p-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-[var(--border)]">
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
        </Modal>
    );
};
