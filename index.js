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
    "secret",
    { expiresIn: "7d" }
  );

  return token;
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const verify = jwt.verify(token, "secret");

  if (!verify?.email) {
    return res.send(" You are not authorized");
  }
  req.user = verify.email;

  next();
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

    //   News

    app.get("/news", async (req, res) => {
      const data = news.find();
      const result = await data.sort({ "publishedAt": -1 }).toArray();
      res.send(result);
    });

    app.get("/news/:id", async (req, res) => {
      const id = req.params.id;
      const result = await news.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/news/add-post",verifyToken, async (req, res) => {
      const data = req.body;
      const result = await news.insertOne(data);
      res.send(result);
    });
    app.delete("/news/delete-post/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await news.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch("/news/edit-post/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const result = await news.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      res.send(result);
    });

    app.get("/news/my-post/:email", async (req, res) => {
      const email = req.params.email;
      const result = await news.find({ authorEmail: email }).toArray();
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
      const token = createToken(data);

      const itUserExist = await user.findOne({ email: user?.email });
      if (itUserExist?._id) {
        return res.send({
          token,
        });
      }
      await user.insertOne(data);
      res.send(token);
    });
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await user.findOne({ email });
      res.send(result);
    });

    app.patch("/user/:email", verifyToken,async (req, res) => {
      const email = req.params.email;
      const updateData = req.body;
      const result = await user.updateOne(
        { email },
        { $set: updateData },
        { upsert: true }
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

app.get('/', async (req, res) => {
  res.send('server is running')
})
app.listen(port, () => {
  console.log(`running port is ${port}`)
})