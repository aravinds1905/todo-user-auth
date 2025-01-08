const app_vars = {
  apiUrl: "http://localhost:3000",
};

const API_URL = app_vars.apiUrl;
let token = null;

function register() {
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).then((response) => {
    if (response.ok) {
      alert("User registered successfully!");
      window.location.href = "index.html";
    } else {
      alert("Error registering user");
    }
  });
}

function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.token) {
        token = data.token;
        alert("Login successful!");
        localStorage.setItem("token", token); // Save token for subsequent API calls
        window.location.href = "todos.html"; // Redirect to todos page
      } else {
        alert("Invalid credentials");
      }
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Unauthorized access. Please login first.");
    window.location.href = "login.html";
  } else {
    fetchTodos(token);
  }
});

function fetchTodos(token) {
  fetch(`${API_URL}/todos`, {
    headers: { Authorization: token },
  })
    .then((response) => response.json())
    .then((todos) => {
      const todoList = document.getElementById("todo-list");
      todoList.innerHTML = "";
      todos.forEach((todo) => {
        const todoDiv = document.createElement("div");
        todoDiv.className = "todo";
        todoDiv.innerHTML = `
            <strong>${todo.title}</strong> 
            <button onclick="deleteTodo(${todo.id}, '${token}')">Delete</button>
          `;
        todoList.appendChild(todoDiv);
      });
    });
}

function addTodo() {
  const title = document.getElementById("todo-title").value;
  //   const description = document.getElementById("todo-description").value;

  fetch(`${API_URL}/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ title }),
  }).then((response) => {
    if (response.ok) {
      alert("Todo added successfully!");
      fetchTodos(token);
    } else {
      alert("Error adding todo");
    }
  });
}

function deleteTodo(id, token) {
  fetch(`${API_URL}/todos/${id}`, {
    method: "DELETE",
    headers: { Authorization: token },
  }).then((response) => {
    if (response.ok) {
      alert("Todo deleted successfully!");
      fetchTodos(token);
    } else {
      alert("Error deleting todo");
    }
  });
}

// });
