import "./App.css";
import { useEffect, useState } from "react";
import ICanDevApp from "icandev-js-sdk";

const EMPTY_TASK = { id: "", title: "", isDone: false };


// Создаём сконфигурированный объект приложения
const app = new ICanDevApp({
  apiKey: "YOUR_API_KEY_HERE", // Получить свой API Key можно на главной странице проекта
});

async function dbGetTasks() {

    // Создаём кастомный тип, который будет использоваться для получения данных из таблицы
    type TaskTable = {
      id: string, 
      title: string | undefined, 
      isDone: boolean,
    }

    // Создаёт итератор по строкам таблицы, который будет запрашивать по 256 строк за раз
    const rowIterator = app.db.table<TaskTable>("tasks").getRowIterator(256);
  
    const tasks: TaskTable[] = [];
  
    // Преобразовываем строки в задачи и собираем в массив
    for await (const row of rowIterator) {
      tasks.push({
        id: row.id,
        title: row.title,
        isDone: row.isDone,
      });
    }
  
    return tasks;
  }

  async function dbSaveTask(task) {
    // Задаём значения колонок

    const data = {
      title: task.title,
      isDone: task.isDone,
    };
  
    // Если задаче присвоен id в таблице, обновляем её
    if (task.id) return app.db.table("tasks").updateRow(task.id, data);
  
    // Иначе, создаём такую задачу и присваиваем ей id
    task.id = await app.db.table("tasks").addRow(data);
  }

  async function dbDeleteTask(task) {
    // Если задаче не присвоен id в таблице - нечего удалять
    if (!task.id) return;
  
    // Удаляем задачу
    await app.db.table("tasks").deleteRow(task.id);
  }

function App() {
  const [currentTask, setCurrentTask] = useState(EMPTY_TASK);
  const [tasks, setTasks] = useState<{id: string, title: string | undefined; isDone: boolean}[]>([]);

  const addTask = () => {
    dbSaveTask(currentTask);
    setTasks((tasks) => [...tasks, currentTask]);
    setCurrentTask(EMPTY_TASK);
  };

  const markTask = (event, index) => {
    const updatedTasks = tasks.map((task, i) => {
      if (i === index) return { ...task, isDone: !task.isDone };
      return task;
    });
    dbSaveTask(updatedTasks[index]);
    setTasks(updatedTasks);
  };

  useEffect(() => {
    dbGetTasks().then((tasks) => setTasks(tasks));
  }, []);

  const deleteTask = (index) => {
    dbDeleteTask(tasks[index]);
    setTasks((tasks) => tasks.filter((task, i) => i !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    addTask();
  };

  return (
    <div className="container">
      <header className="header">
        <h1>ToDo List</h1>
        <form onSubmit={handleSubmit}>
          <input
            value={currentTask.title}
            className="input-task-title"
            placeholder="What needs to be done?"
            onChange={(event) => setCurrentTask({ id: "", title: event.target.value, isDone: false})}
          />
          <button className="add">Add task</button>
        </form>
      </header>
      <ul className="tasks">
        {tasks.map((task, i) => (
          <li key={`todo-${i}`} className ="newtask">
            {task.title}
            <input
              type="checkbox"
              className="check"
              checked={task.isDone}
              onChange={(event) => markTask(event, i)}
            />
            <button 
              type="button" 
              className="del" 
              onClick={(e) => deleteTask(i)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;