import mongoose from 'mongoose';
import { config } from '../config';
import {
  User,
  Organization,
  Team,
  TeamMember,
  Project,
  ProjectMember,
  TaskGroup,
  Task,
  TaskLabel,
  ProjectLabel,
  LabelColor
} from '../models';

const seedData = async (): Promise<void> => {
  try {
    // Connect to database
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Team.deleteMany({});
    await TeamMember.deleteMany({});
    await Project.deleteMany({});
    await ProjectMember.deleteMany({});
    await TaskGroup.deleteMany({});
    await Task.deleteMany({});
    // await TaskAssigned.deleteMany({});
    await ProjectLabel.deleteMany({});
    await LabelColor.deleteMany({});

    console.log('Cleared existing data');

    // Create label colors
    const labelColors = [
      { name: 'Purple', colorHex: '#e362e3', position: 0 },
      { name: 'Blue', colorHex: '#7a6ff0', position: 1 },
      { name: 'Teal', colorHex: '#37c5ab', position: 2 },
      { name: 'Pink', colorHex: '#aa62e3', position: 3 },
      { name: 'Red', colorHex: '#e8384f', position: 4 },
      { name: 'Orange', colorHex: '#ff8c00', position: 5 },
      { name: 'Green', colorHex: '#28a745', position: 6 },
      { name: 'Yellow', colorHex: '#ffc107', position: 7 },
    ];

    const createdLabelColors = await LabelColor.insertMany(labelColors);
    console.log('Created label colors');

    // Create organization
    const organization = new Organization({
      name: 'Acme Corp',
    });
    await organization.save();
    console.log('Created organization');

    // Create users
    const users = [
      {
        fullName: 'John Doe',

        email: 'john@example.com',
        password: 'password123',
        initials: 'JD',
        role: 'owner',
        active: true,
        profileIcon: {
          initials: 'JD',
          bgColor: '#6366f1',
        },
      },
      {
        fullName: 'Jane Smith',

        email: 'jane@example.com',
        password: 'password123',
        initials: 'JS',
        role: 'admin',
        active: true,
        profileIcon: {
          initials: 'JS',
          bgColor: '#e362e3',
        },
      },
      {
        fullName: 'Bob Wilson',

        email: 'bob@example.com',
        password: 'password123',
        initials: 'BW',
        role: 'member',
        active: true,
        profileIcon: {
          initials: 'BW',
          bgColor: '#37c5ab',
        },
      },
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Created users');

    // Create team
    const team = new Team({
      name: 'Engineering',
      organizationId: organization._id,
    });
    await team.save();
    console.log('Created team');

    // Create team members
    const teamMembers = [
      {
        teamId: team._id,
        userId: createdUsers[0]._id,
        role: 'owner',
        addedDate: new Date(),
      },
      {
        teamId: team._id,
        userId: createdUsers[1]._id,
        role: 'admin',
        addedDate: new Date(),
      },
      {
        teamId: team._id,
        userId: createdUsers[2]._id,
        role: 'member',
        addedDate: new Date(),
      },
    ];

    await TeamMember.insertMany(teamMembers);
    console.log('Created team members');

    // Create projects
    const projects = [
      {
        name: 'Website Redesign',
        teamId: team._id,
      },
      {
        name: 'Mobile App',
        teamId: team._id,
      },
      {
        name: 'Personal Tasks',
        teamId: null,
      },
    ];

    const createdProjects = await Project.insertMany(projects);
    console.log('Created projects');

    // Create project members
    const projectMembers = [
      // Website Redesign project
      {
        projectId: createdProjects[0]._id,
        userId: createdUsers[0]._id,
        role: 'owner',
        addedAt: new Date(),
      },
      {
        projectId: createdProjects[0]._id,
        userId: createdUsers[1]._id,
        role: 'member',
        addedAt: new Date(),
      },
      // Mobile App project
      {
        projectId: createdProjects[1]._id,
        userId: createdUsers[0]._id,
        role: 'owner',
        addedAt: new Date(),
      },
      {
        projectId: createdProjects[1]._id,
        userId: createdUsers[2]._id,
        role: 'member',
        addedAt: new Date(),
      },
      // Personal Tasks project
      {
        projectId: createdProjects[2]._id,
        userId: createdUsers[0]._id,
        role: 'owner',
        addedAt: new Date(),
      },
    ];

    await ProjectMember.insertMany(projectMembers);
    console.log('Created project members');

    // Create task groups for each project
    const taskGroups = [];
    for (let i = 0; i < createdProjects.length; i++) {
      const project = createdProjects[i];
      const groups = [
        { name: 'To Do', position: 0 },
        { name: 'In Progress', position: 1 },
        { name: 'Done', position: 2 },
      ];

      for (const group of groups) {
        const taskGroup = new TaskGroup({
          projectId: project._id,
          name: group.name,
          position: group.position,
        });
        await taskGroup.save();
        taskGroups.push(taskGroup);
      }
    }
    console.log('Created task groups');

    // Create project labels
    const projectLabels = [
      {
        projectId: createdProjects[0]._id,
        name: 'Design',
        labelColorId: createdLabelColors[0]._id,
        createdDate: new Date(),
      },
      {
        projectId: createdProjects[0]._id,
        name: 'Research',
        labelColorId: createdLabelColors[1]._id,
        createdDate: new Date(),
      },
      {
        projectId: createdProjects[1]._id,
        name: 'Development',
        labelColorId: createdLabelColors[2]._id,
        createdDate: new Date(),
      },
      {
        projectId: createdProjects[1]._id,
        name: 'Bug',
        labelColorId: createdLabelColors[4]._id,
        createdDate: new Date(),
      },
    ];

    const createdProjectLabels = await ProjectLabel.insertMany(projectLabels);
    console.log('Created project labels');

    // Create tasks
    const tasks = [
      // Website Redesign project tasks
      {
        taskGroupId: taskGroups[0]._id, // To Do
        name: 'Design new homepage layout',
        description: 'Create a modern, responsive homepage layout',
        complete: false,
        position: 0,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        hasTime: false,
        assigned: [
          {
            userId: createdUsers[1]._id, // Jane Smith
            assignedDate: new Date(),
          }
        ]
      },
      {
        taskGroupId: taskGroups[0]._id, // To Do
        name: 'Research competitor websites',
        description: 'Analyze top 10 competitor websites for inspiration',
        complete: false,
        position: 1,
        hasTime: false,
        assigned: [
          {
            userId: createdUsers[0]._id, // John Doe
            assignedDate: new Date(),
          }
        ]
      },
      {
        taskGroupId: taskGroups[1]._id, // In Progress
        name: 'Create wireframes',
        description: 'Develop low-fidelity wireframes for key pages',
        complete: false,
        position: 0,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        hasTime: false,
        assigned: [
          {
            userId: createdUsers[1]._id, // Jane Smith
            assignedDate: new Date(),
          }
        ]
      },
      {
        taskGroupId: taskGroups[2]._id, // Done
        name: 'Project kickoff meeting',
        description: 'Initial project planning and requirements gathering',
        complete: true,
        position: 0,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        hasTime: false,
        assigned: [
          {
            userId: createdUsers[0]._id, // John Doe
            assignedDate: new Date(),
          }
        ]
      },
      // Mobile App project tasks
      {
        taskGroupId: taskGroups[3]._id, // To Do
        name: 'Set up development environment',
        description: 'Configure React Native development setup',
        complete: false,
        position: 0,
        hasTime: false,
        assigned: [
          {
            userId: createdUsers[2]._id, // Bob Wilson
            assignedDate: new Date(),
          }
        ]
      },
      // Personal Tasks project
      {
        taskGroupId: taskGroups[6]._id, // To Do
        name: 'Buy groceries',
        description: 'Weekly grocery shopping',
        complete: false,
        position: 0,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        hasTime: false,
        assigned: [
          {
            userId: createdUsers[0]._id, // John Doe
            assignedDate: new Date(),
          }
        ]
      },
    ];

    const createdTasks = await Task.insertMany(tasks);
    console.log('Created tasks');

    // Create task assignments - MOVED TO EMBEDDED
    /*
    const taskAssignments = [
      {
        taskId: createdTasks[0]._id,
        userId: createdUsers[1]._id, // Jane Smith
        assignedDate: new Date(),
      },
      ...
    ];
    // await TaskAssigned.insertMany(taskAssignments);
    // console.log('Created task assignments');
    */

    // Create task assignments - MOVED TO EMBEDDED
    /*
    const taskAssignments = [
      {
        taskId: createdTasks[0]._id,
        userId: createdUsers[1]._id, // Jane Smith
        assignedDate: new Date(),
      },
      ...
    ];
    await TaskAssigned.insertMany(taskAssignments);
    console.log('Created task assignments');
    */

    // Create task labels
    const taskLabels = [
      {
        taskId: createdTasks[0]._id,
        projectLabelId: createdProjectLabels[0]._id, // Design
        assignedDate: new Date(),
      },
      {
        taskId: createdTasks[1]._id,
        projectLabelId: createdProjectLabels[1]._id, // Research
        assignedDate: new Date(),
      },
      {
        taskId: createdTasks[2]._id,
        projectLabelId: createdProjectLabels[0]._id, // Design
        assignedDate: new Date(),
      },
      {
        taskId: createdTasks[4]._id,
        projectLabelId: createdProjectLabels[2]._id, // Development
        assignedDate: new Date(),
      },
    ];

    await TaskLabel.insertMany(taskLabels);
    console.log('Created task labels');

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${createdUsers.length} users created`);
    console.log(`- ${createdLabelColors.length} label colors created`);
    console.log(`- 1 organization created`);
    console.log(`- 1 team created`);
    console.log(`- ${createdProjects.length} projects created`);
    console.log(`- ${taskGroups.length} task groups created`);
    console.log(`- ${createdTasks.length} tasks created`);
    // console.log(`- ${taskAssignments.length} task assignments created`);
    console.log(`- ${createdProjectLabels.length} project labels created`);
    console.log(`- ${taskLabels.length} task labels created`);

    console.log('\n🔑 Test credentials:');
    console.log('Email: john@example.com, Password: password123');
    console.log('Email: jane@example.com, Password: password123');
    console.log('Email: bob@example.com, Password: password123');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export default seedData;
