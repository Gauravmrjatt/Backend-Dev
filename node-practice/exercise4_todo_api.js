const express = require('express');
const app = express();
app.use(express.json());

let todos = [];
let id = 1;

app.post('/todos', (req, res) => {
  const todo = { id: id++, task: req.body.task };
  todos.push(todo);
  res.json(todo);
});

app.get('/todos', (req, res) => {
  res.json(todos);
});

app.put('/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id == req.params.id);
  if (!todo) return res.status(404).send('Not found');
  todo.task = req.body.task;
  res.json(todo);
});

app.delete('/todos/:id', (req, res) => {
  todos = todos.filter(t => t.id != req.params.id);
  res.send('Deleted');
});

app.listen(3000, () => console.log('TODO API running on port 3000'));
