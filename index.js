const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Strip Ke
const stripe = require("stripe")(process.env.STRIPE_SECRET);
// middleware
app.use(cors());
app.use(express.json());

const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");




const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
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
    req.decoded_email = decoded.email

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
    const tutorApplications = db.collection('tutorApplications');
    const paymentsCollection = db.collection('payments');

    // verifyAdmin middleware
    const verifyAdmin = async (req, res, next) => {
      try {
        const email = req.decoded_email;
        const user = await userCollection.findOne({ email });

        if (!user || user.role !== 'admin') {
          return res.status(403).send({ message: 'forbidden access' });
        }

        next();
      } catch (error) {
        res.status(500).send({ error: 'Admin verify failed' });
      }
    };

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
    app.get('/users', verifyFBToken, verifyAdmin, async (req, res) => {
      const rusult = await userCollection.find({ role: 'Tutor' }).toArray()
      res.send(rusult)
    })
    // Latest 6 tutors
    app.get('/users/tutors/latest', async (req, res) => {
      try {
        const result = await userCollection
          .find({ role: 'tutor' })
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Fetch failed' });
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
    app.patch('/users/update/:email', verifyFBToken, async (req, res) => {
      try {
        const email = req.params.email;
        const { name, phone, photoURL } = req.body;

        const result = await userCollection.updateOne(
          { email },
          { $set: { name, phone, photoURL } }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Update failed' });
      }
    });
    // Uaer Management
    app.get('/users/admin', verifyFBToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().sort({ createdAt: -1 }).toArray();
      res.send(result);
    })
    // Role update
    app.patch('/users/:id/role', verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const { role } = req.body;
        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { role } }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Role update failed' });
      }
    });
    // User delete
    app.delete('/users/:id', verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const result = await userCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Delete failed' });
      }
    });
    // tutor paj data
    app.get('/users/tutors', async (req, res) => {
      try {
        const result = await userCollection
          .find({ role: 'tutor' })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Fetch failed' });
      }
    });
    // ==========



    // ================= TUITION ROUTES =================
    // My data is being posted.
    app.post('/tuitionPosts', async (req, res) => {
      try {
        const tuition = req.body;
        const result = await TuitionPostCollection.insertOne(tuition);

        res.send(result);

      } catch (error) {
        res.status(500).send({ error: 'Insert failed' });
      }
    });

    // Private - dashboard (নিজের data)
    app.get('/myTuitions', verifyFBToken, async (req, res) => {
      try {
        const email = req.query.email;

        if (email !== req.decoded_email) {
          return res.status(403).send({ message: 'forbidden access' });
        }

        const result = await TuitionPostCollection
          .find({ email })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Fetch failed' });
      }
    });
    // Can I delete my data?
    app.delete('/tuitionPosts/:id', verifyFBToken, async (req, res) => {
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
    // Admin - সব data (Pending + Approved + Rejected)
    app.get('/admin/tuitionPosts', verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const result = await TuitionPostCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Fetch failed' });
      }
    });

    // Amr data Admin Approved + Rejected updat korba tar API
    app.patch('/tuitionPosts/:id/status', verifyFBToken, verifyAdmin, async (req, res) => {
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
    // amr Approved pajr API
    app.get('/Tution/tuitionPosts', async (req, res) => {
      const rusult = await TuitionPostCollection.find({
        status: 'Approved'
      }).sort({ createdAt: -1 }).toArray()
      res.send(rusult)
    })
    // Latest 6 tuitions (Approved)
    app.get('/tuitionPosts/latest', async (req, res) => {
      try {
        const result = await TuitionPostCollection
          .find({ status: 'Approved' })
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Fetch failed' });
      }
    });

    // Amr view Detils paj API
    app.get('/tuitionPosts/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await TuitionPostCollection.findOne(query);
      res.send(result);
    });
    // ==========

    // ================Tutor Routh==============
    app.post('/tutorApplications', verifyFBToken, async (req, res) => {
      const tutor = req.body;
      // check যদি আগে apply করা থাকে
      const existing = await tutorApplications.findOne({
        tuitionId: tutor.tuitionId,
        tutorEmail: tutor.tutorEmail,
      });

      if (existing) {
        return res.status(400).send({ message: 'Already applied to this tuition' });
      }
      const rusult = await tutorApplications.insertOne(tutor)
      res.send(rusult)
    })
    // Check if tutor already applied
    app.get('/tutorApplications/check', async (req, res) => {
      const { tuitionId, tutorEmail } = req.query;
      const query = { tuitionId, tutorEmail };
      const existing = await tutorApplications.findOne(query);
      res.send({ applied: existing ? true : false });
    });
    //  Studend paj data show
    app.get('/tutorApplications/Student', verifyFBToken, async (req, res) => {
      const email = req.query.email;
      const query = {}
      if (email) {
        query.studentEmail = email
        if (email !== req.decoded_email) {
          return res.status(403).send({ message: 'forbidden' })
        }
      }
      const rusult = await tutorApplications.find(query).sort({ paidAt: -1 }).toArray()
      res.send(rusult)

    })
    app.get('/tutorApplications/ongoing', verifyFBToken, async (req, res) => {
      try {
        const email = req.query.email;

        if (email !== req.decoded_email) {
          return res.status(403).send({ message: 'forbidden' });
        }

        const result = await tutorApplications
          .find({ tutorEmail: email, status: 'Approved' })
          .sort({ appliedAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Fetch failed' });
      }
    });
    // Tutor paj data show
    app.get('/tutorApplications/Tutor', verifyFBToken, async (req, res) => {
      const email = req.query.email;
      const query = {}
      if (email) {
        query.tutorEmail = email
        if (email !== req.decoded_email) {
          return res.status(403).send({ message: 'forbidden' })
        }
      }
      const rusult = await tutorApplications.find(query).sort({ paidAt: -1 }).toArray()
      res.send(rusult)
    })
    // Student Apply Tution Updat
    app.patch('/update/Apply/:id', verifyFBToken, async (req, res) => {
      const status = req.body.status;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: status
        }
      }
      const rusult = await tutorApplications.updateOne(query, updateDoc)
      res.send(rusult)
    })
    // Tutor Delete API
    app.delete('/tutorApplications/:id', verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const rusult = await tutorApplications.deleteOne(query)
      res.send(rusult)
    })
    // ================pamant Reletat API=================
    app.post('/create-checkout-session', verifyFBToken, async (req, res) => {
      const paymentinfo = req.body
      console.log(paymentinfo)
      const amount = parseInt(paymentinfo.amount) * 100;
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: amount,
              product_data: {
                name: `Tutor payment - ${paymentinfo.tutorName}`
              }
            },
            quantity: 1,
          }
        ],
        mode: 'payment',
        metadata: {
          applicationId: paymentinfo.applicationId,
          tutorName: paymentinfo.tutorName,
          studentName: paymentinfo.studentName
        },
        customer_email: paymentinfo.studentEmail,
        success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}&applicationId=${paymentinfo.applicationId}`,
        cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`
      })
      res.send({ url: session.url })
    })

    app.get('/payment-success', async (req, res) => {
      try {
        const sessionId = req.query.session_id;

        const applicationId = req.query.applicationId;




        // Stripe থেকে session data আনুন
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const transactionId = session.payment_intent;

        // Already paid check করুন
        const alreadyPaid = await paymentsCollection.findOne({ transactionId });
        if (alreadyPaid) {
          return res.send({ message: 'already exists', transactionId });
        }

        if (session.payment_status === 'paid') {
          // Application data আনুন
          const app = await tutorApplications.findOne({
            _id: new ObjectId(applicationId),
          });

          // Application Approved করুন
          await tutorApplications.updateOne(
            { _id: new ObjectId(applicationId) },
            { $set: { status: 'Approved' } }
          );

          // Payment save করুন
          const payment = {

            transactionId,
            sessionId,
            studentEmail: session.customer_email,
            studentName: session.metadata.studentName,
            tutorEmail: app?.tutorEmail,
            tutorName: app?.tutorName,
            tuitionId: app?.tuitionId,
            tuitionSubject: app?.subjects,
            applicationId,
            amount: session.amount_total / 100,
            currency: session.currency,
            paymentStatus: 'paid',
            paymentDate: new Date().toISOString().split('T')[0],
            stripePaymentIntentId: transactionId,
            paidAt: new Date(),
          };

          const result = await paymentsCollection.insertOne(payment);

          return res.send({ success: true, payment: result });
        }

        return res.send({ success: false });

      } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Payment success failed' });
      }
    });

    // Student Payment History
    app.get('/student-payments', verifyFBToken, async (req, res) => {
      const email = req.query.email;
      const rusult = await paymentsCollection.find({
        studentEmail: email,
        paymentStatus: 'paid'
      }).sort({ paidAt: -1 }).toArray();
      res.send(rusult);

    })
    // Tutor Payment History
    app.get('/tutor-payments', verifyFBToken, async (req, res) => {
      const email = req.query.email;
      const rusult = await paymentsCollection.find({
        tutorEmail: email,
        paymentStatus: 'paid'

      }).sort({ paidAt: -1 }).toArray();
      res.send(rusult)
    })
    // Admin - সব payment
    app.get('/payments/admin', verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const result = await paymentsCollection
          .find()
          .sort({ paidAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Fetch failed' });
      }
    });


    // ================= PING =================
    // await client.db('admin').command({ ping: 1 });
    // console.log('MongoDB ping successful 🚀');

  } catch (error) {
    console.log('MongoDB connection error:', error);
  }
}

run().catch(console.dir);

// ================= SERVER START =================
app.listen(port, () => {
  console.log(`Server running on port ${port} 🚀`);
});