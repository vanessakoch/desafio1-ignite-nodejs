const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if (!user) {
    response.status(404).json('Usuário não encontrado')
  }

  request.user = user;
  return next();
}

function checkTodoExistency(request, response, next) {
  const { id } = request.params;
  const { user } = request;

  const todos = user.todos;
  const filteredTodo = todos.find((todo) => todo.id === id);

  if (!filteredTodo) {
    return response.status(404).json({
      error: "Todo não encontrado!",
    });
  }

  request.todo = filteredTodo;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userExists = users.some(user => user.username === username);

  if (userExists) {
    return response.status(400).json({ error: 'Usuário já possui cadastro.' });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser);
  response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(newTodo);
  response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, checkTodoExistency, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);
  response.status(201).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkTodoExistency, (request, response) => {
  const { user, todo } = request;

  todo.done = true;
  response.status(200).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checkTodoExistency, (request, response) => {
  const { user, todo } = request;
  const todoIndex = user.todos.findIndex((t) => t.id === todo.id);

  user.todos.splice(todoIndex, 1);

  return response.status(204).json();
});

module.exports = app;