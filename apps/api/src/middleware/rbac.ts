import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ProjectMember, TeamMember } from '../models';

export const requireProjectPermission = (allowedRoles: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Authentication required' });
                return;
            }

            const projectId = req.params.projectId || req.params.id || req.body.projectId;

            if (!projectId) {
                res.status(400).json({ message: 'Project ID is required' });
                return;
            }

            const member = await ProjectMember.findOne({
                projectId,
                userId: req.user._id,
            });

            if (!member) {
                // Check if user is owner of the organization/team? 
                // For now, strict project membership check.
                // If the user is a site-wide admin/owner, they might override, but let's stick to project roles for now.
                res.status(403).json({ message: 'Access denied: Not a member of this project' });
                return;
            }

            if (!allowedRoles.includes(member.role)) {
                res.status(403).json({ message: 'Insufficient permissions' });
                return;
            }

            next();
        } catch (error) {
            console.error('RBAC Error:', error);
            res.status(500).json({ message: 'Internal server error during permission check' });
        }
    };
};

export const requireTeamPermission = (allowedRoles: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Authentication required' });
                return;
            }

            const teamId = req.params.teamId || req.params.id || req.body.teamId;

            if (!teamId) {
                res.status(400).json({ message: 'Team ID is required' });
                return;
            }

            const member = await TeamMember.findOne({
                teamId,
                userId: req.user._id,
            });

            if (!member) {
                res.status(403).json({ message: 'Access denied: Not a member of this team' });
                return;
            }

            if (!allowedRoles.includes(member.role)) {
                res.status(403).json({ message: 'Insufficient permissions' });
                return;
            }

            next();
        } catch (error) {
            console.error('RBAC Error:', error);
            res.status(500).json({ message: 'Internal server error during permission check' });
        }
    };
};
