const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");
const http = require("http");
const socketIO = require("socket.io");
const multer = require("multer");
const { Pool } = require("pg");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST","PUT"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  }
});

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST","PUT"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
app.use(express.static(__dirname + "/public"));

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/upload-folder/');
  },
  filename: function(req, file, cb) {
    
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: req.file });
});

app.post('/voice-add', upload.single('audio'), (req, res) => {
  res.json({ file: req.file });
});

app.post('/upload-media', upload.array('photos'), (req, res) => {
  let mediaArray = [];
  console.log(req.files);
  req.files.forEach((item) => {
        if(item.mimetype.split('/')[0] === 'video'){
          mediaArray.push({
            fileType: item.mimetype,
            fileName: item.originalname,
          });
        }
  });
  res.json(mediaArray);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mydb",
  password: "ramin1998",
  port: 5432,
});

app.get("/download", function (req, res) {
  let fileName = req.query.nameoffile;
  const file = `${__dirname}/public/upload-folder/${fileName}`;
  res.download(file);
});

io.on("connection", (socket) => {
  socket.on("join chat", (users) => {
    console.log('Joining chat:', users);
    let user1 = users.userfirst.toLowerCase();
    let user2 = users.usersecond.toLowerCase();

    pool.query(
      `CREATE TABLE IF NOT EXISTS ${user1}and${user2} (
            id SERIAL PRIMARY KEY,
            message TEXT NOT NULL,
            fromuser VARCHAR(100) NOT NULL,
            photos JSONB,
            nameoffile TEXT,
            voice TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );`,
      (err, res) => {
        if (err) {
          console.error('Error creating table:', err);
        } else {
          console.log('Table created or exists already');
        }
      }
    );
    console.log("User connected");
  });

  socket.on("read chat", (users) => {
    let user1 = users.userfirst.toLowerCase();
    let user2 = users.usersecond.toLowerCase();
    pool.query(`SELECT * FROM ${user1}and${user2}`, (err, response) => {
      if (err) {
        console.error('Error reading chat:', err);
        socket.emit('chat history', []);
      } else {
        socket.emit("chat history", response.rows);
      }
    });
  });

  socket.on("chat message", (msg) => {
    console.log('Received chat message:', msg);

    pool.query(
      `INSERT INTO ${msg.userfirst}and${msg.usersecond} (message, fromuser, photos, nameoffile,voice) VALUES ($1, $2, $3, $4,$5) RETURNING *`,
      [msg.message, msg.fromuser, JSON.stringify(msg.photos), msg.file ? msg.file.nameoffile : null, msg.voice.filename],
      (err, res) => {
        if (err) {
          console.error('Error inserting message:', err);
        } else {
          console.log('Message inserted:', res.rows[0]);
        }
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
