import React, { useState } from 'react';

const App = () => {
  const [task, setTask] = useState('');
  const [todolist, setTodoList] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const add_data = (event) => {
    event.preventDefault();
    const taskText = task.trim();
    if (!taskText) {
      alert('Please enter a task.');
      return;
    } else if (editingIndex !== null) {
      setTodoList((currentList) =>
        currentList.map((item, index) =>
          index === editingIndex ? taskText : item,
        ),
      );
      setEditingIndex(null);
    } else {
      setTodoList((currentList) => [...currentList, taskText]);
    }
    setTask('');
  };

  const editHandler = (index) => {
    setTask(todolist[index]);
    setEditingIndex(index);
  };

  const deleteHandler = (index) => {
    setTodoList((currentList) =>
      currentList.filter((_, itemIndex) => itemIndex !== index),
    );
    if (editingIndex === index) {
      setEditingIndex(null);
      setTask('');
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setTask('');
  };

  return (
    <main className="todo-card">
      <h1>TODO LIST</h1>
      <form className="add-form" onSubmit={add_data}>
        <label className="visually-hidden" htmlFor="task-input">
          Enter a task
        </label>
        <input
          id="task-input"
          type="text"
          placeholder="What needs to be done?"
          value={task}
          onChange={(event) => setTask(event.target.value)}
        />
        <button className="add-button" type="submit">
          {editingIndex === null ? 'ADD' : 'UPDATE'}
        </button>
        {editingIndex !== null && (
          <button
            className="cancel-button"
            type="button"
            onClick={cancelEdit}
          >
            CANCEL
          </button>
        )}
      </form>

      {todolist.length === 0 ? (
        <p className="empty-message">Your tasks will appear here.</p>
      ) : (
        <ul className="task-list">
          {todolist.map((item, index) => (
            <li className="task-item" key={index}>
              <span className="task-text">{item}</span>
              <div className="task-actions">
                <button
                  className="edit-button"
                  type="button"
                  onClick={() => editHandler(index)}
                >
                  EDIT
                </button>
                <button
                  className="delete-button"
                  type="button"
                  onClick={() => deleteHandler(index)}
                >
                  DELETE
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default App;
