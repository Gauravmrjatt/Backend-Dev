
const express = require("express");
const app = express();

app.use(express.json());

/*
==============================
 Dummy Data
==============================
*/

let books = [
  { id: 1, title: "Node Basics", author: "John", year: 2020 },
  { id: 2, title: "Express Guide", author: "Mike", year: 2022 },
  { id: 3, title: "JavaScript Pro", author: "John", year: 2019 }
];

let authors = [];

/*
==============================
 Exercise 2 Middleware
==============================
*/

const validateYear = (req, res, next) => {

  const { year } = req.body;

  if (!year || isNaN(year)) {
    return res.status(400).json({
      error: "Year must be a valid number"
    });
  }

  const currentYear = new Date().getFullYear();

  if (year < 1900 || year > currentYear) {
    return res.status(400).json({
      error: "Year must be between 1900 and current year"
    });
  }

  next();
};

/*
==============================
 Exercise 1 + 3
 Filter + Pagination
==============================
*/

app.get("/books", (req, res) => {

  let result = [...books];

  const { author, year, page = 1, limit = 5 } = req.query;

  // Filtering
  if (author) {
    result = result.filter(b =>
      b.author.toLowerCase() === author.toLowerCase()
    );
  }

  if (year) {
    result = result.filter(b =>
      b.year === Number(year)
    );
  }

  // Pagination
  const start = (page - 1) * limit;
  const paginated = result.slice(start, start + Number(limit));

  res.json({
    total: result.length,
    page: Number(page),
    totalPages: Math.ceil(result.length / limit),
    data: paginated
  });
});

/*
==============================
 Add Book (Validation)
==============================
*/

app.post("/books", validateYear, (req, res) => {

  const book = {
    id: books.length + 1,
    ...req.body
  };

  books.push(book);

  res.status(201).json(book);
});

/*
==============================
 Exercise 5
 Search by Title
==============================
*/

app.get("/books/search", (req, res) => {

  const { title } = req.query;

  if (!title) {
    return res.status(400).json({
      error: "Provide title to search"
    });
  }

  const results = books.filter(book =>
    book.title.toLowerCase().includes(title.toLowerCase())
  );

  res.json(results);
});

/*
==============================
 Exercise 4
 AUTHORS CRUD
==============================
*/

// CREATE
app.post("/authors", (req, res) => {

  const author = {
    id: authors.length + 1,
    name: req.body.name
  };

  authors.push(author);
  res.status(201).json(author);
});

// READ ALL
app.get("/authors", (req, res) => {
  res.json(authors);
});

// READ ONE
app.get("/authors/:id", (req, res) => {

  const author = authors.find(a => a.id === Number(req.params.id));

  if (!author) {
    return res.status(404).json({
      error: "Author not found"
    });
  }

  res.json(author);
});

// UPDATE
app.put("/authors/:id", (req, res) => {

  const author = authors.find(a => a.id === Number(req.params.id));

  if (!author) {
    return res.status(404).json({
      error: "Author not found"
    });
  }

  author.name = req.body.name;

  res.json(author);
});

// DELETE
app.delete("/authors/:id", (req, res) => {

  authors = authors.filter(a =>
    a.id !== Number(req.params.id)
  );

  res.json({
    message: "Author deleted"
  });
});

/*
==============================
 Server
==============================
*/

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});

