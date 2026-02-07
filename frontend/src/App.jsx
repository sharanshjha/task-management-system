import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_PRODUCTION_API = "https://task-management-system-sh4i.onrender.com/api/v1";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "/api/v1" : DEFAULT_PRODUCTION_API);
const STATUS_FILTERS = ["All", "Pending", "Completed"];
const INITIAL_FORM = { title: "", description: "" };

function sortTasksByDate(tasks) {
  return [...tasks].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data;
}

function formatTimestamp(value) {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const noticeTimeoutRef = useRef(null);

  const showNotice = (type, text) => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }

    setNotice({ type, text });

    noticeTimeoutRef.current = setTimeout(() => {
      setNotice(null);
    }, 3000);
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest("/tasks");
      setTasks(sortTasksByDate(data.data || []));
    } catch (loadError) {
      setError(loadError.message || "Unable to load tasks right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();

    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  const taskCounts = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "Completed").length;
    const pending = total - completed;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, pending, completionRate };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const byStatus = filter === "All" || task.status === filter;
      const bySearch =
        normalizedSearch.length === 0 ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.description.toLowerCase().includes(normalizedSearch);

      return byStatus && bySearch;
    });
  }, [tasks, filter, search]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    const title = formData.title.trim();
    const description = formData.description.trim();

    if (!title || !description) {
      showNotice("error", "Title and description are required.");
      return;
    }

    try {
      setSubmitting(true);
      const data = await apiRequest("/tasks", {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });

      setTasks((prev) => sortTasksByDate([data.data, ...prev]));
      setFormData(INITIAL_FORM);
      showNotice("success", "Task created successfully.");
    } catch (createError) {
      showNotice("error", createError.message || "Unable to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === "Pending" ? "Completed" : "Pending";

    try {
      setActiveTaskId(task._id);
      const data = await apiRequest(`/tasks/${task._id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status: nextStatus,
        }),
      });

      setTasks((prev) =>
        sortTasksByDate(
          prev.map((existingTask) => (existingTask._id === task._id ? data.data : existingTask))
        )
      );
      showNotice("success", "Task status updated.");
    } catch (updateError) {
      showNotice("error", updateError.message || "Unable to update task.");
    } finally {
      setActiveTaskId("");
    }
  };

  const handleDeleteTask = async (taskId) => {
    const isConfirmed = window.confirm("Delete this task permanently?");
    if (!isConfirmed) {
      return;
    }

    try {
      setActiveTaskId(taskId);
      await apiRequest(`/tasks/${taskId}`, {
        method: "DELETE",
      });

      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      showNotice("success", "Task deleted.");
    } catch (deleteError) {
      showNotice("error", deleteError.message || "Unable to delete task.");
    } finally {
      setActiveTaskId("");
    }
  };

  return (
    <div className="app-shell">
      <header className="hero-panel reveal-fast">
        <div>
          <p className="eyebrow">Task Management System</p>
          <h1>Build momentum, one task at a time</h1>
          <p className="hero-copy">
            A modern control center for your work. Add tasks, track progress, and close work faster.
          </p>
        </div>

        <div className="hero-stats">
          <article className="hero-stat-card">
            <p>Total Tasks</p>
            <strong>{taskCounts.total}</strong>
          </article>
          <article className="hero-stat-card">
            <p>Completed</p>
            <strong>{taskCounts.completed}</strong>
          </article>
          <article className="hero-stat-card">
            <p>Pending</p>
            <strong>{taskCounts.pending}</strong>
          </article>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="panel composer-panel reveal-med">
          <div className="panel-heading">
            <h2>Create Task</h2>
            <button type="button" className="outline-btn" onClick={loadTasks} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <form className="task-form" onSubmit={handleCreateTask}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Plan sprint backlog"
              value={formData.title}
              onChange={handleInputChange}
              maxLength={120}
              required
            />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Outline deliverables, owners, and deadlines."
              value={formData.description}
              onChange={handleInputChange}
              maxLength={500}
              required
            />

            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? "Saving..." : "Add Task"}
            </button>
          </form>

          <div className="progress-wrapper">
            <div className="progress-header">
              <span>Completion</span>
              <span>{taskCounts.completionRate}%</span>
            </div>
            <div className="progress-track" role="presentation">
              <span style={{ width: `${taskCounts.completionRate}%` }} />
            </div>
          </div>
        </section>

        <section className="panel tasks-panel reveal-slow">
          <div className="panel-heading">
            <h2>Task Board</h2>
            <p>{visibleTasks.length} shown</p>
          </div>

          <div className="toolbar">
            <input
              type="search"
              placeholder="Search title or description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <div className="filter-group">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={filter === status ? "chip active" : "chip"}
                  onClick={() => setFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {notice ? <div className={`notice ${notice.type}`}>{notice.text}</div> : null}
          {error ? <div className="notice error">{error}</div> : null}

          {loading ? (
            <div className="loading-state">Loading tasks...</div>
          ) : visibleTasks.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks match your filters</h3>
              <p>Try adjusting search or status, or create a new task.</p>
            </div>
          ) : (
            <ul className="task-list">
              {visibleTasks.map((task, index) => {
                const isBusy = activeTaskId === task._id;
                const statusClass = task.status === "Completed" ? "completed" : "pending";

                return (
                  <li
                    key={task._id}
                    className={`task-card ${statusClass}`}
                    style={{ animationDelay: `${Math.min(index * 0.08, 0.5)}s` }}
                  >
                    <div className="task-top-row">
                      <h3>{task.title}</h3>
                      <span className={`status-pill ${statusClass}`}>{task.status}</span>
                    </div>

                    <p>{task.description}</p>

                    <div className="task-footer">
                      <small>Created {formatTimestamp(task.createdAt)}</small>

                      <div className="task-actions">
                        <button
                          type="button"
                          className="outline-btn"
                          onClick={() => handleToggleTask(task)}
                          disabled={isBusy}
                        >
                          {task.status === "Pending" ? "Mark Done" : "Reopen"}
                        </button>

                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => handleDeleteTask(task._id)}
                          disabled={isBusy}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
