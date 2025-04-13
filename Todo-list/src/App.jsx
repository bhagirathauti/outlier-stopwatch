import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Check, X, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import "./App.css";

function App() {
  // State for categories and tasks
  const [categories, setCategories] = useState(() => {
    const savedCategories = localStorage.getItem('categories');
    return savedCategories ? JSON.parse(savedCategories) : [
      { id: 'category-1', name: 'Work', color: 'bg-blue-100 border-blue-500', expanded: true },
      { id: 'category-2', name: 'Personal', color: 'bg-green-100 border-green-500', expanded: true },
      { id: 'category-3', name: 'Fitness', color: 'bg-purple-100 border-purple-500', expanded: true }
    ];
  });
  
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [
      { id: 'task-1', title: 'Complete project proposal', description: 'Finish the Q2 project outline', categoryId: 'category-1', completed: false },
      { id: 'task-2', title: 'Update website content', description: 'Add new testimonials section', categoryId: 'category-1', completed: true },
      { id: 'task-3', title: 'Buy groceries', description: 'Get milk, eggs, and bread', categoryId: 'category-2', completed: false },
      { id: 'task-4', title: 'Call mom', description: '', categoryId: 'category-2', completed: false },
      { id: 'task-5', title: 'Go for a run', description: '30 minute jog around the park', categoryId: 'category-3', completed: false },
      { id: 'task-6', title: 'Schedule gym session', description: 'Book Thursday evening class', categoryId: 'category-3', completed: true }
    ];
  });
  
  // New task / category form states
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    categoryId: ''
  });
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    color: 'bg-gray-100 border-gray-500'
  });
  const [editingTask, setEditingTask] = useState(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  
  // Active drag state for animation purposes
  const [activeId, setActiveId] = useState(null);

  // Color options for categories
  const colorOptions = [
    { value: 'bg-blue-100 border-blue-500', display: 'Blue' },
    { value: 'bg-green-100 border-green-500', display: 'Green' },
    { value: 'bg-red-100 border-red-500', display: 'Red' },
    { value: 'bg-yellow-100 border-yellow-500', display: 'Yellow' },
    { value: 'bg-purple-100 border-purple-500', display: 'Purple' },
    { value: 'bg-pink-100 border-pink-500', display: 'Pink' },
    { value: 'bg-indigo-100 border-indigo-500', display: 'Indigo' },
    { value: 'bg-gray-100 border-gray-500', display: 'Gray' }
  ];

  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before it's considered a drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Save to localStorage whenever tasks or categories change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  // Task Management Functions
  const addTask = () => {
    if (!newTaskForm.title.trim() || !newTaskForm.categoryId) return;
    
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskForm.title.trim(),
      description: newTaskForm.description.trim(),
      categoryId: newTaskForm.categoryId,
      completed: false
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskForm({ title: '', description: '', categoryId: '' });
    setIsNewTaskModalOpen(false);
  };
  
  const updateTask = () => {
    if (!editingTask || !editingTask.title.trim() || !editingTask.categoryId) return;
    
    setTasks(tasks.map(task => 
      task.id === editingTask.id ? editingTask : task
    ));
    
    setEditingTask(null);
  };
  
  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };
  
  const toggleTaskCompletion = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Category Management Functions
  const addCategory = () => {
    if (!newCategoryForm.name.trim()) return;
    
    const newCategory = {
      id: `category-${Date.now()}`,
      name: newCategoryForm.name.trim(),
      color: newCategoryForm.color,
      expanded: true
    };
    
    setCategories([...categories, newCategory]);
    setNewCategoryForm({ name: '', color: 'bg-gray-100 border-gray-500' });
    setIsNewCategoryModalOpen(false);
  };

  const deleteCategory = (categoryId) => {
    setCategories(categories.filter(category => category.id !== categoryId));
    // Remove tasks in deleted category
    setTasks(tasks.filter(task => task.categoryId !== categoryId));
  };

  const toggleCategoryExpansion = (categoryId) => {
    setCategories(categories.map(category => 
      category.id === categoryId ? { ...category, expanded: !category.expanded } : category
    ));
  };

  // Drag and Drop Handling with @dnd-kit
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    if (active.id !== over.id) {
      const activeTask = tasks.find(task => task.id === active.id);
      const overTask = tasks.find(task => task.id === over.id);
      
      // If dropping on another task in the same category
      if (activeTask.categoryId === overTask.categoryId) {
        setTasks(currentTasks => {
          const oldCategoryTasks = currentTasks.filter(task => task.categoryId === activeTask.categoryId);
          const otherCategoryTasks = currentTasks.filter(task => task.categoryId !== activeTask.categoryId);
          
          const oldIndex = oldCategoryTasks.findIndex(task => task.id === active.id);
          const newIndex = oldCategoryTasks.findIndex(task => task.id === over.id);
          
          const reorderedCategoryTasks = arrayMove(oldCategoryTasks, oldIndex, newIndex);
          return [...otherCategoryTasks, ...reorderedCategoryTasks];
        });
      } 
      // If dropping on a task in a different category
      else {
        setTasks(currentTasks => {
          const updatedTasks = currentTasks.map(task => {
            if (task.id === active.id) {
              return { ...task, categoryId: overTask.categoryId };
            }
            return task;
          });
          
          const targetCategoryTasks = updatedTasks.filter(task => task.categoryId === overTask.categoryId);
          const otherTasks = updatedTasks.filter(task => task.categoryId !== overTask.categoryId);
          
          const activeIndex = targetCategoryTasks.findIndex(task => task.id === active.id);
          const overIndex = targetCategoryTasks.findIndex(task => task.id === over.id);
          
          const reorderedTargetTasks = arrayMove(targetCategoryTasks, activeIndex, overIndex);
          
          return [...otherTasks, ...reorderedTargetTasks];
        });
      }
    }
  };

  // Handle dropping tasks into empty categories (where there is no 'over' task)
  const handleDragOver = (event) => {
    const { active, over } = event;
    
    // If over a category droppable and not over a task, move to that category
    if (over && over.id.startsWith('category-') && active.id.startsWith('task-')) {
      const activeTask = tasks.find(task => task.id === active.id);
      
      // Only process if the task is being moved to a new category
      if (activeTask.categoryId !== over.id) {
        setTasks(currentTasks => 
          currentTasks.map(task => 
            task.id === active.id ? { ...task, categoryId: over.id } : task
          )
        );
      }
    }
  };

  // Sortable Task Component
  function SortableTask({ task, index }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: task.id });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : 1,
      opacity: isDragging ? 0.8 : 1,
    };
    
    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className={`mb-3 rounded-lg p-3 ${task.completed ? 'bg-gray-100' : 'bg-white'} shadow-sm border border-gray-200 ${isDragging ? 'shadow-lg' : ''}`}
        {...attributes}
        {...listeners}
      >
        <div className="flex gap-3 items-start">
          <button
            onClick={() => toggleTaskCompletion(task.id)}
            className={`mt-1 flex-shrink-0 ${task.completed ? 'text-green-500' : 'text-gray-400'} hover:text-green-600 transition-colors`}
          >
            {task.completed ? <Check size={18} /> : <div className="w-4 h-4 border-2 border-gray-400 rounded-sm" />}
          </button>
          <div className="flex-1">
            <h3 className={`text-md font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                {task.description}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setEditingTask({...task})}
              className="text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Get category-specific task IDs for SortableContext
  const getCategoryTaskIds = (categoryId) => {
    return tasks
      .filter(task => task.categoryId === categoryId)
      .map(task => task.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Task Manager</h1>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setIsNewTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>Add Task</span>
            </button>
            <button 
              onClick={() => setIsNewCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <PlusCircle size={18} />
              <span>New Category</span>
            </button>
          </div>
        </header>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <motion.div 
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`rounded-lg shadow-md border-2 ${category.color} overflow-hidden`}
              >
                <div className="flex justify-between items-center p-4 border-b">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {category.expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <h2 className="font-semibold text-lg">{category.name}</h2>
                  </div>
                  <button 
                    onClick={() => deleteCategory(category.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                {category.expanded && (
                  <div className="p-3 min-h-32" id={category.id}>
                    <SortableContext 
                      items={getCategoryTaskIds(category.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <AnimatePresence>
                        {tasks
                          .filter(task => task.categoryId === category.id)
                          .map((task, index) => (
                            <SortableTask key={task.id} task={task} index={index} />
                          ))}
                      </AnimatePresence>
                    </SortableContext>
                    
                    {tasks.filter(task => task.categoryId === category.id).length === 0 && (
                      <div className="text-center py-6 text-gray-400 italic text-sm">
                        No tasks in this category
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </DndContext>

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl">No categories yet.</p>
            <p className="mt-2">Create a category to get started.</p>
          </div>
        )}
      </div>

      {/* New Task Modal */}
      <AnimatePresence>
        {isNewTaskModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
             className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-lg flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Task</h2>
                <button onClick={() => setIsNewTaskModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                  <input
                    type="text"
                    value={newTaskForm.title}
                    onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newTaskForm.description}
                    onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description"
                    rows={3}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                  <select
                    value={newTaskForm.categoryId}
                    onChange={(e) => setNewTaskForm({...newTaskForm, categoryId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsNewTaskModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTask}
                    disabled={!newTaskForm.title.trim() || !newTaskForm.categoryId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Category Modal */}
      <AnimatePresence>
        {isNewCategoryModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-lg flex items-center justify-center p-4 z-50"

          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create New Category</h2>
                <button onClick={() => setIsNewCategoryModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name*</label>
                  <input
                    type="text"
                    value={newCategoryForm.name}
                    onChange={(e) => setNewCategoryForm({...newCategoryForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setNewCategoryForm({...newCategoryForm, color: color.value})}
                        className={`h-8 rounded-md border-2 ${color.value} ${newCategoryForm.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        aria-label={`Select ${color.display} color`}
                      ></button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsNewCategoryModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCategory}
                    disabled={!newCategoryForm.name.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                  >
                    Create Category
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-lg flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Task</h2>
                <button onClick={() => setEditingTask(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description"
                    rows={3}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                  <select
                    value={editingTask.categoryId}
                    onChange={(e) => setEditingTask({...editingTask, categoryId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center mt-3">
                  <input
                    type="checkbox"
                    id="completed"
                    checked={editingTask.completed}
                    onChange={(e) => setEditingTask({...editingTask, completed: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="completed" className="ml-2 text-sm text-gray-700">
                    Mark as completed
                  </label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateTask}
                    disabled={!editingTask.title.trim() || !editingTask.categoryId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                  >
                    Update Task
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
