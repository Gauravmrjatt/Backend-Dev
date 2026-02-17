
const express = require("express");
const app = express();
const path = require("path");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

/*
==============================
Dummy Data
==============================
*/

let users = [
  { name: "Yash" },
  { name: "Amit" },
  { name: "Rahul" }
];

let posts = [];

/*
==============================
Middleware → Response Time Logger
==============================
*/

app.use((req, res, next) => {

  const start = Date.now();

  res.on("finish", () => {
    const time = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${time}ms`);
  });

  next();
});

/*
==============================
1️⃣ Query Filter Users
==============================
*/

app.get("/users", (req, res) => {

  const { name } = req.query;

  let filtered = users;

  if (name) {
    filtered = users.filter(u =>
      u.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  res.json(filtered);
});

/*
==============================
Home
==============================
*/

app.get("/", (req, res) => {
  res.render("index");
});

/*
==============================
3️⃣ Contact Form
==============================
*/

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/contact", (req, res) => {

  console.log("Form Data:", req.body);

  res.send("✅ Form submitted successfully!");
});

/*
==============================
5️⃣ Photo Gallery
==============================
*/

app.get("/gallery", (req, res) => {

  const images = [
    "https://picsum.photos/300?random=1",
    "https://picsum.photos/300?random=2",
    "https://picsum.photos/300?random=3",
    "https://picsum.photos/300?random=4"
  ];

  res.render("gallery", { images });
});

/*
==============================
6️⃣ BLOG
==============================
*/

// List posts
app.get("/blog", (req, res) => {
  res.render("blog", { posts });
});

// New post form
app.get("/blog/new", (req, res) => {
  res.render("newpost");
});

// Create post
app.post("/blog", (req, res) => {

  const { title, content } = req.body;

  posts.push({
    id: posts.length + 1,
    title,
    content
  });

  res.redirect("/blog");
});

// View single post
app.get("/blog/:id", (req, res) => {

  const post = posts.find(p => p.id == req.params.id);

  if (!post) {
    return res.render("404");
  }

  res.render("post", { post });
});

/*
==============================
4️⃣ Custom 404
==============================
*/

app.use((req, res) => {
  res.status(404).render("404");
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});

