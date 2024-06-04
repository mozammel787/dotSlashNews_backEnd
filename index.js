const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://mhfaryanemon:1234567890@cluster0.tph3j8f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
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

    //   News

    app.get("/news", async (req, res) => {
      const data = news.find();
      const result = await data.toArray();
      res.send(result);
    });

    app.get("/news/:id", async (req, res) => {
      const id = req.params.id;
      const result = await news.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/news/add-post", async (req, res) => {
      const data = req.body;
      const result = await news.insertOne(data);
      res.send(result);
    });
    app.delete("/news/delete-post/:id", async (req, res) => {
      const id = req.params.id;
      const result = await news.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch("/news/edit-post/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const result = await news.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      res.send(result);
    });

    app.get("/news/my-post/:id", async (req, res) => {
      const email = req.params.id;
      const result = await news.find({ author: email }).toArray();
      res.send(result);
    });

    app.get("/news/catagory/:catagory", async (req, res) => {
      const catagory = req.params.catagory;
      const result = await news.find({ catagory: catagory }).toArray();
      res.send(result);
    });

    // user

    app.get("/user", async (req, res) => {
      const data = user.find();
      const result = await data.toArray();
      res.send(result);
    });
    app.post("/user", async (req, res) => {
      const data = req.body;
      const result = await user.insertOne(data);
      res.send(result);
    });

    app.patch("/user/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const result = await news.updateOne(
        { email: email },
        { $set: updateData }
      );
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("it's work");
});
app.listen(port, (req, res) => {
  console.log(port);
});
