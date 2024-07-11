const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

function createToken(user) {
  const token = jwt.sign(
    {
      email: user.email,
    },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "7d" }
  );

  return token;
}

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send("Authorization header missing");
    }

    const token = authHeader.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET || "default_secret");

    if (!verify?.email) {
      return res.status(401).send("You are not authorized");
    }
    req.user = verify.email;

    next();
  } catch (error) {
    return res.status(401).send("Invalid or expired token");
  }
}

const client = new MongoClient(process.env.URI, {
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

    // News

    app.get("/news", async (req, res) => {
      try {
        const data = news.find();
        const result = await data.sort({ "publishedAt": -1 }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Error retrieving news");
      }
    });

    app.get("/news/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await news.findOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send("Error retrieving news item");
      }
    });

    app.post("/news/add-post", verifyToken, async (req, res) => {
      try {
        const data = req.body;
        const result = await news.insertOne(data);
        res.send(result);
      } catch (error) {
        res.status(500).send("Error adding news post");
      }
    });

    app.delete("/news/delete-post/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const result = await news.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send("Error deleting news post");
      }
    });

    app.patch("/news/edit-post/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = req.body;
        const result = await news.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send("Error editing news post");
      }
    });

    app.get("/news/my-post/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await news.find({ authorEmail: email }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Error retrieving user's posts");
      }
    });

    app.get("/news/category/:category", async (req, res) => {
      try {
        const category = req.params.category;
        const result = await news.find({ category: category }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Error retrieving news by category");
      }
    });

    // User

    app.get("/user", async (req, res) => {
      try {
        const data = user.find();
        const result = await data.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Error retrieving users");
      }
    });

    app.post("/user", async (req, res) => {
      try {
        const data = req.body;
        const token = createToken(data);

        const itUserExist = await user.findOne({ email: data.email });
        if (itUserExist?._id) {
          return res.send({ token });
        }
        await user.insertOne(data);
        res.send({ token });
      } catch (error) {
        res.status(500).send("Error adding user");
      }
    });

    app.get("/user/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await user.findOne({ email });
        res.send(result);
      } catch (error) {
        res.status(500).send("Error retrieving user");
      }
    });

    app.patch("/user/:email", verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        const updateData = req.body;
        const result = await user.updateOne(
          { email },
          { $set: updateData },
          { upsert: true }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send("Error updating user");
      }
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
