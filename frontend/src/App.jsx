import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_PRODUCTION_API = "https://task-management-system-sh4i.onrender.com/api/v1";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "/api/v1" : DEFAULT_PRODUCTION_API);
const AUTH_STORAGE_KEY = "tms_auth_session_v1";

const STATUS_FILTERS = ["All", "Pending", "Completed"];
const PRIORITY_FILTERS = ["All", "Low", "Medium", "High"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "dueSoon", label: "Due Soon" },
  { value: "priority", label: "Priority" },
];

const INITIAL_AUTH_FORM = {
  name: "",
  email: "",
  password: "",
};

const INITIAL_TASK_FORM = {
  title: "",
  description: "",
  priority: "Medium",
  dueDate: "",
};

const readStoredSession = () => {
  try {
    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    const parsed = JSON.parse(rawSession);
    if (!parsed?.token || !parsed?.user) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const persistSession = (session) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

const clearSessionStorage = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

async function apiRequest(path, options = {}, token = "") {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

const formatTimestamp = (value) => {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatDate = (value) => {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const isOverdue = (task) => {
  if (!task.dueDate || task.status === "Completed") {
    return false;
  }

  return new Date(task.dueDate).getTime() < Date.now();
};

export default function App() {
  const [session, setSession] = useState(() => readStoredSession());
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(INITIAL_AUTH_FORM);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState("");
  const [taskForm, setTaskForm] = useState(INITIAL_TASK_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const [filters, setFilters] = useState({
    status: "All",
    priority: "All",
    sort: "newest",
    search: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 50,
  });

  const noticeTimeoutRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const token = session?.token || "";
  const user = session?.user || null;

  const showNotice = (type, text) => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }

    setNotice({ type, text });
    noticeTimeoutRef.current = setTimeout(() => {
      setNotice(null);
    }, 3500);
  };

  const logout = (sessionExpired = false) => {
    clearSessionStorage();
    setSession(null);
    setTasks([]);
    setError("");
    setNotice(null);
    setPagination((prev) => ({ ...prev, page: 1, pages: 1, total: 0 }));
    setAuthMode("login");
    setAuthForm(INITIAL_AUTH_FORM);
    if (sessionExpired) {
      setAuthError("Session expired. Please log in again.");
    }
  };

  const handleAuthFailure = (requestError) => {
    if (requestError.status === 401) {
      logout(true);
      return;
    }

    setError(requestError.message || "Request failed");
  };

  const buildTasksQuery = (page = 1) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    params.set("sort", filters.sort);

    if (filters.status !== "All") {
      params.set("status", filters.status);
    }

    if (filters.priority !== "All") {
      params.set("priority", filters.priority);
    }

    const normalizedSearch = filters.search.trim();
    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    }

    return params.toString();
  };

  const loadTasks = async (page = 1) => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const query = buildTasksQuery(page);
      const response = await apiRequest(`/tasks?${query}`, {}, token);

      setTasks(response.data || []);
      setPagination({
        page: response.pagination?.page || page,
        pages: response.pagination?.pages || 1,
        total: response.pagination?.total || 0,
        limit: response.pagination?.limit || 50,
      });
    } catch (requestError) {
      handleAuthFailure(requestError);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!token) {
      return;
    }

    try {
      const profileResponse = await apiRequest("/auth/me", {}, token);
      const nextSession = {
        token,
        user: profileResponse.data,
      };
      setSession(nextSession);
      persistSession(nextSession);
    } catch (requestError) {
      handleAuthFailure(requestError);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    refreshProfile();
    loadTasks(1);

    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      loadTasks(1);
    }, 280);
  }, [filters.search, filters.status, filters.priority, filters.sort, token]);

  const handleAuthInput = (event) => {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaskInput = (event) => {
    const { name, value } = event.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    const name = authForm.name.trim();
    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password;

    if (!email || !password || (authMode === "register" && !name)) {
      setAuthError("Please fill all required fields.");
      return;
    }

    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }

    const endpoint = authMode === "register" ? "/auth/register" : "/auth/login";
    const body =
      authMode === "register"
        ? { name, email, password }
        : {
            email,
            password,
          };

    try {
      setAuthLoading(true);
      setAuthError("");
      const response = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const nextSession = {
        token: response.data.token,
        user: response.data.user,
      };

      setSession(nextSession);
      persistSession(nextSession);
      setAuthForm(INITIAL_AUTH_FORM);
      showNotice("success", authMode === "register" ? "Account created successfully." : "Welcome back.");
    } catch (requestError) {
      setAuthError(requestError.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    const title = taskForm.title.trim();
    const description = taskForm.description.trim();

    if (!title || !description) {
      showNotice("error", "Title and description are required.");
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest(
        "/tasks",
        {
          method: "POST",
          body: JSON.stringify({
            title,
            description,
            priority: taskForm.priority,
            dueDate: taskForm.dueDate || null,
          }),
        },
        token
      );

      setTaskForm(INITIAL_TASK_FORM);
      showNotice("success", "Task created successfully.");
      loadTasks(1);
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure(requestError);
      } else {
        showNotice("error", requestError.message || "Unable to create task.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === "Pending" ? "Completed" : "Pending";

    try {
      setActiveTaskId(task._id);
      await apiRequest(
        `/tasks/${task._id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
        token
      );

      setTasks((prev) =>
        prev.map((item) => (item._id === task._id ? { ...item, status: nextStatus } : item))
      );
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure(requestError);
      } else {
        showNotice("error", requestError.message || "Unable to update status.");
      }
    } finally {
      setActiveTaskId("");
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm("Delete this task permanently?");
    if (!confirmed) {
      return;
    }

    try {
      setActiveTaskId(taskId);
      await apiRequest(
        `/tasks/${taskId}`,
        {
          method: "DELETE",
        },
        token
      );

      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      showNotice("success", "Task deleted.");

      if (tasks.length === 1 && pagination.page > 1) {
        loadTasks(pagination.page - 1);
      } else {
        loadTasks(pagination.page);
      }
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure(requestError);
      } else {
        showNotice("error", requestError.message || "Unable to delete task.");
      }
    } finally {
      setActiveTaskId("");
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "Completed").length;
    const highPriority = tasks.filter((task) => task.priority === "High").length;
    const overdue = tasks.filter((task) => isOverdue(task)).length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, highPriority, overdue, completionRate };
  }, [tasks]);

  if (!session?.token) {
    return (
      <div className="auth-shell">
        <section className="auth-hero">
          <p className="eyebrow">TaskFlow Pro</p>
          <h1>Private workspace for focused execution</h1>
          <p>
            Secure task management with account-based access, priority planning, due dates, and progress
            tracking.
          </p>
          <ul>
            <li>JWT authentication and protected APIs</li>
            <li>Per-user task privacy</li>
            <li>Production-ready React + Node deployment</li>
          </ul>
        </section>

        <section className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={authMode === "login" ? "tab active" : "tab"}
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
            >
              Log In
            </button>
            <button
              type="button"
              className={authMode === "register" ? "tab active" : "tab"}
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
              }}
            >
              Sign Up
            </button>
          </div>

          <h2>{authMode === "register" ? "Create your account" : "Welcome back"}</h2>
          <p className="auth-subtext">
            {authMode === "register"
              ? "Create your secure workspace to manage tasks privately."
              : "Log in to access your private dashboard."}
          </p>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === "register" ? (
              <>
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={authForm.name}
                  onChange={handleAuthInput}
                  required
                />
              </>
            ) : null}

            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={authForm.email}
              onChange={handleAuthInput}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={authForm.password}
              onChange={handleAuthInput}
              required
            />

            {authError ? <div className="notice error">{authError}</div> : null}

            <button type="submit" className="primary-btn auth-submit" disabled={authLoading}>
              {authLoading ? "Please wait..." : authMode === "register" ? "Create Account" : "Log In"}
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar reveal-fast">
        <div>
          <p className="eyebrow">Secure Task Workspace</p>
          <h1>Execution Dashboard</h1>
          <p className="hero-copy">Welcome, {user?.name}. Your tasks are private to your account.</p>
        </div>

        <div className="topbar-actions">
          <div className="identity-chip">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <button type="button" className="outline-btn" onClick={() => logout(false)}>
            Logout
          </button>
        </div>
      </header>

      <section className="stat-grid reveal-med">
        <article className="stat-card">
          <p>Total</p>
          <strong>{stats.total}</strong>
        </article>
        <article className="stat-card">
          <p>Completed</p>
          <strong>{stats.completed}</strong>
        </article>
        <article className="stat-card">
          <p>High Priority</p>
          <strong>{stats.highPriority}</strong>
        </article>
        <article className="stat-card">
          <p>Overdue</p>
          <strong>{stats.overdue}</strong>
        </article>
      </section>

      <main className="dashboard-grid reveal-slow">
        <section className="panel composer-panel">
          <div className="panel-heading">
            <h2>Create Task</h2>
            <button type="button" className="outline-btn" onClick={() => loadTasks(1)} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <form className="task-form" onSubmit={handleCreateTask}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Prepare sprint demo"
              value={taskForm.title}
              onChange={handleTaskInput}
              maxLength={120}
              required
            />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Summarize completed features and open issues."
              value={taskForm.description}
              onChange={handleTaskInput}
              maxLength={1000}
              required
            />

            <div className="dual-fields">
              <div>
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleTaskInput}
                  className="select-input"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="dueDate">Due Date</label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={handleTaskInput}
                />
              </div>
            </div>

            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? "Saving..." : "Add Task"}
            </button>
          </form>

          <div className="progress-wrapper">
            <div className="progress-header">
              <span>Completion</span>
              <span>{stats.completionRate}%</span>
            </div>
            <div className="progress-track" role="presentation">
              <span style={{ width: `${stats.completionRate}%` }} />
            </div>
          </div>
        </section>

        <section className="panel tasks-panel">
          <div className="panel-heading">
            <h2>Task Board</h2>
            <p>{pagination.total} total</p>
          </div>

          <div className="toolbar">
            <input
              type="search"
              placeholder="Search title or description"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />

            <select
              className="select-input"
              value={filters.sort}
              onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-row">
            <div className="chip-group">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={filters.status === status ? "chip active" : "chip"}
                  onClick={() => setFilters((prev) => ({ ...prev, status }))}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="chip-group">
              {PRIORITY_FILTERS.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={filters.priority === priority ? "chip active" : "chip"}
                  onClick={() => setFilters((prev) => ({ ...prev, priority }))}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {notice ? <div className={`notice ${notice.type}`}>{notice.text}</div> : null}
          {error ? <div className="notice error">{error}</div> : null}

          {loading ? (
            <div className="loading-state">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks found</h3>
              <p>Create a task or adjust filters to see results.</p>
            </div>
          ) : (
            <ul className="task-list">
              {tasks.map((task, index) => {
                const busy = activeTaskId === task._id;
                const overdue = isOverdue(task);
                const priorityClass = `priority-${task.priority.toLowerCase()}`;

                return (
                  <li
                    key={task._id}
                    className={`task-card ${task.status === "Completed" ? "completed" : "pending"}`}
                    style={{ animationDelay: `${Math.min(index * 0.06, 0.4)}s` }}
                  >
                    <div className="task-top-row">
                      <h3>{task.title}</h3>
                      <span className={`status-pill ${task.status === "Completed" ? "completed" : "pending"}`}>
                        {task.status}
                      </span>
                    </div>

                    <p>{task.description}</p>

                    <div className="meta-row">
                      <span className={`priority-pill ${priorityClass}`}>{task.priority} priority</span>
                      <span className={overdue ? "date-pill overdue" : "date-pill"}>{formatDate(task.dueDate)}</span>
                    </div>

                    <div className="task-footer">
                      <small>Created {formatTimestamp(task.createdAt)}</small>

                      <div className="task-actions">
                        <button
                          type="button"
                          className="outline-btn"
                          onClick={() => handleToggleStatus(task)}
                          disabled={busy}
                        >
                          {task.status === "Pending" ? "Mark Done" : "Reopen"}
                        </button>
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => handleDeleteTask(task._id)}
                          disabled={busy}
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

          {pagination.pages > 1 ? (
            <div className="pager">
              <button
                type="button"
                className="outline-btn"
                disabled={pagination.page <= 1 || loading}
                onClick={() => loadTasks(pagination.page - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                type="button"
                className="outline-btn"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => loadTasks(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
