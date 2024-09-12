const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function createToken(user) {
  const token = jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
  return token;
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Token is missing");
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded.email;
    next();
  } catch (err) {
    return res.status(401).send("Invalid token");
  }
}

const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("dot_slash_news");
    const news = database.collection("news");
    const user = database.collection("user");

    // News routes
    app.get("/news", async (req, res) => {
      try {
        const result = await news.find().sort({ publishedAt: -1 }).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send("Error fetching news");
      }
    });

    app.get("/news/:id", async (req, res) => {
      try {
        const id = new ObjectId(req.params.id);
        const result = await news.findOne({ _id: id });
        res.send(result);
      } catch (err) {
        res.status(500).send("Error fetching news by ID");
      }
    });

    app.post("/news/add-post", verifyToken, async (req, res) => {
      try {
        const result = await news.insertOne(req.body);
        res.send(result);
      } catch (err) {
        res.status(500).send("Error adding news post");
      }
    });

    app.delete("/news/delete-post/:id", verifyToken, async (req, res) => {
      try {
        const id = new ObjectId(req.params.id);
        const result = await news.deleteOne({ _id: id });
        res.send(result);
      } catch (err) {
        res.status(500).send("Error deleting news post");
      }
    });

    app.patch("/news/edit-post/:id", verifyToken, async (req, res) => {
      try {
        const id = new ObjectId(req.params.id);
        const result = await news.updateOne(
          { _id: id },
          { $set: req.body }
        );
        res.send(result);
      } catch (err) {
        res.status(500).send("Error updating news post");
      }
    });

    app.get("/news/my-post/:email", async (req, res) => {
      try {
        const result = await news.find({ authorEmail: req.params.email }).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send("Error fetching user's posts");
      }
    });

    app.get("/news/category/:category", async (req, res) => {
      try {
        const result = await news.find({ category: req.params.category }).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send("Error fetching news by category");
      }
    });

    // User routes
    app.get("/user", async (req, res) => {
      try {
        const result = await user.find().toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send("Error fetching users");
      }
    });

    app.post("/user", async (req, res) => {
      try {
        const data = req.body;
        const existingUser = await user.findOne({ email: data.email });
        const token = createToken(data);
        
        if (existingUser) {
          return res.send({ token });
        }
        
        await user.insertOne(data);
        res.send({ token });
      } catch (err) {
        res.status(500).send("Error creating user");
      }
    });

    app.get("/user/:email", async (req, res) => {
      try {
        const result = await user.findOne({ email: req.params.email });
        res.send(result);
      } catch (err) {
        res.status(500).send("Error fetching user by email");
      }
    });

    app.patch("/user/:email", verifyToken, async (req, res) => {
      try {
        const result = await user.updateOne(
          { email: req.params.email },
          { $set: req.body },
          { upsert: true }
        );
        res.send(result);
      } catch (err) {
        res.status(500).send("Error updating user");
      }
    });

    console.log("Connected to MongoDB!");
  } finally {
   
  }
}

run().catch(console.error);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
