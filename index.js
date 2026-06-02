const express = require('express')
// middleware bannowr jnow
const cors = require('cors')
const app = express()
// .env file
require('dotenv').config()
const port = process.env.PORT || 3000
// mongodb import
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



// middleware
app.use(express.json())
app.use(cors())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@my-first-cluster.ofk8daf.mongodb.net/?appName=my-First-Cluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("etuitiondb_db")
    const TuitionPostCollection = db.collection('tuitionPosts')
    const userCollection = db.collection('users')

    // user post api
    app.post('/users', async (req, res) => {
      const user = req.body
      user.createdAt = new Date();
      const email = user.email;
      const userExisterts = await userCollection.findOne({ email })
      if (userExisterts) {
        return res.send({ message: 'user exists' })
      }
      const rusult = await userCollection.insertOne(user)
      res.send(rusult)
    })


    // Tuition post API
    app.get('/tuitionPosts', async (req, res) => {
      const query = {}
      const { email, status } = req.query
      if (email) {
        query.email = email
      }
      if (status) {
        query.status = status
      }
      const options = { sort: { createdAt: -1 } }

      const cursor = TuitionPostCollection.find(query, options)
      const rusult = await cursor.toArray();
      res.send(rusult)
    })
    app.delete('/tuitionPosts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const rusult = await TuitionPostCollection.deleteOne(query)
      res.send(rusult)
    })

    app.post('/tuitionPosts', async (req, res) => {
      const tuition = req.body
      const rusult = await TuitionPostCollection.insertOne(tuition)
      res.send(rusult)
      console.log(rusult)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
