const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
console.log('admin:', admin);
console.log('admin.credential:', admin.credential);

const serviceAccount = require("./etuitiondb-firebase-adminsdk-fbsvc-0bf105b9e1.json");

admin.initializeApp({
  credential: admin.cert(serviceAccount)
});


const verifyFBToken = async (req, res, next) => {

  const token = req.headers.authorization
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  try {
    const IdToken = token.split(' ')[1]
    const decoded = await getAuth().verifyIdToken(IdToken);
    console.log(decoded)
    res.decoded_email = decoded.email

    next();

  } catch (error) {
    return res.status(401).send({ message: 'unauthorized access' })
  }

}

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@my-first-cluster.ofk8daf.mongodb.net/?appName=my-First-Cluster`;

// Mongo client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// ================= ROOT ROUTE =================
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// ================= MAIN FUNCTION =================
async function run() {
  try {
    await client.connect();
    console.log('MongoDB connected successfully ✅');

    const db = client.db('etuitiondb_db');
    const userCollection = db.collection('users');
    const TuitionPostCollection = db.collection('tuitionPosts');

    // ================= USER ROUTES =================

    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        user.createdAt = new Date();

        const existUser = await userCollection.findOne({ email: user.email });

        if (existUser) {
          return res.send({ message: 'user exists' });
        }

        const result = await userCollection.insertOne(user);
        res.send(result);

      } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'User insert failed' });
      }
    });

    app.get('/users/:email/role', async (req, res) => {
      try {
        const email = req.params.email;
        const user = await userCollection.findOne({ email });

        res.send({ role: user?.role || 'user' });

      } catch (error) {
        res.status(500).send({ error: 'Role fetch failed' });
      }
    });

    // ================= TUITION ROUTES =================
    app.get('/tuitionPosts', async (req, res) => {
      const query = { status: 'Approved' }
      const rusult = await TuitionPostCollection.find(query).toArray();
      res.send(rusult)

    })

    app.get('/tuitionPosts', verifyFBToken, async (req, res) => {
      try {
        const { email, status } = req.query;
        let query = {};


        if (email) query.email = email;
        if (status) query.status = status;

        const result = await TuitionPostCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);

      } catch (error) {
        res.status(500).send({ error: 'Fetch failed' });
      }
    });

    app.post('/tuitionPosts', async (req, res) => {
      try {
        const tuition = req.body;
        const result = await TuitionPostCollection.insertOne(tuition);

        res.send(result);

      } catch (error) {
        res.status(500).send({ error: 'Insert failed' });
      }
    });
    app.patch('/tuitionPosts/:id/status', verifyFBToken, async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;

        const result = await TuitionPostCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Status update failed' });
      }
    });

    app.delete('/tuitionPosts/:id', async (req, res) => {
      try {
        const id = req.params.id;

        const result = await TuitionPostCollection.deleteOne({
          _id: new ObjectId(id)
        });

        res.send(result);

      } catch (error) {
        res.status(500).send({ error: 'Delete failed' });
      }
    });
    app.get('/tuitionPosts/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await TuitionPostCollection.findOne(query);
      res.send(result);
    });

    // ================= PING =================
    await client.db('admin').command({ ping: 1 });
    console.log('MongoDB ping successful 🚀');

  } catch (error) {
    console.log('MongoDB connection error:', error);
  }
}

run().catch(console.dir);

// ================= SERVER START =================
app.listen(port, () => {
  console.log(`Server running on port ${port} 🚀`);
});