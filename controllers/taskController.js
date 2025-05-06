const Task = require('../models/Task');

// Create a new task
exports.createTask = async (req, res) => {
  const { title, description, dueDate, priority, status, assignedTo } = req.body;
  console.log("req.user", req.user);
  try {
    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      status,
      assignedTo,
      createdBy: req.user,
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tasks for current user
exports.getTasks = async (req, res) => {
  try {
    
    const { page = 1, limit = 10, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
console.log( req.query, "req.query")
    let query = {};
    switch (type) {
      case 'assigned':
        query = { assignedTo: req.user };
        break;
      case 'created':
        query = { createdBy: req.user };
        break;
      case 'overdue':
        query = { 
          $or: [{ createdBy: req.user }, { assignedTo: req.user }],
          dueDate: { $lt: new Date() },
          status: { $ne: 'Completed' }
        };
        break;
      default:
        query = { $or: [{ createdBy: req.user }, { assignedTo: req.user }] };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);
// console.log({
//   tasks,
//   total,
//   page: parseInt(page),
//   pages: Math.ceil(total / parseInt(limit))
// })
    res.json({
      tasks,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only allow access if user is creator or assignee
    if (
      task.createdBy.toString() !== req.user.toString() &&
      (!task.assignedTo || task.assignedTo.toString() !== req.user.toString())
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.createdBy.toString() !== req.user.toString()) {
      return res.status(403).json({ message: 'Only creator can update task' });
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.createdBy.toString() !== req.user.toString()) {
      return res.status(403).json({ message: 'Only creator can delete task' });
    }

    await task.remove();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dashboard Summary
exports.getDashboardTasks = async (req, res) => {
  try {
    const assignedToUser = await Task.find({ assignedTo: req.user });
    const createdByUser = await Task.find({ createdBy: req.user });
    const overdueTasks = await Task.find({
      assignedTo: req.user,
      dueDate: { $lt: new Date() },
      status: { $ne: 'Completed' },
    });

    res.json({
      assignedToUser,
      createdByUser,
      overdueTasks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
