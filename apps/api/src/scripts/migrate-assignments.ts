import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Task } from '../models/Task';
// import { TaskAssigned } from '../models/TaskAssigned';

// Define inline for migration/build purposes since model is removed
const taskAssignedSchema = new mongoose.Schema({
    taskId: { type: String, required: true },
    userId: { type: String, required: true },
    assignedDate: { type: Date, default: Date.now }
});
const TaskAssigned = mongoose.model('TaskAssigned', taskAssignedSchema);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momentum';

const migrateAssignments = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const assignments = await TaskAssigned.find({});
        console.log(`Found ${assignments.length} assignments in TaskAssigned collection`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const assignment of assignments) {
            const task = await Task.findById(assignment.taskId);
            if (!task) {
                console.warn(`Task not found for assignment: ${assignment._id}`);
                continue;
            }

            // Check if already assigned in embedded array
            const isAlreadyAssigned = task.assigned.some(
                (a) => a.userId.toString() === assignment.userId.toString()
            );

            if (!isAlreadyAssigned) {
                task.assigned.push({
                    userId: assignment.userId as any, // Cast to any to avoid type issues during migration
                    assignedDate: assignment.assignedDate,
                });
                await task.save();
                updatedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`Migration complete.`);
        console.log(`Updated Tasks: ${updatedCount}`);
        console.log(`Skipped (Already Synced): ${skippedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateAssignments();
