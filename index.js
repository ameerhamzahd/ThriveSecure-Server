const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@thrivesecure.x2ofshd.mongodb.net/?retryWrites=true&w=majority&appName=ThriveSecure`;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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

        // DATABASE INITIALIZING
        const newsletterSubscriptionsCollection = client.db('ThriveSecureDB').collection('newsletterSubscriptions');
        const usersCollection = client.db('ThriveSecureDB').collection('users');
        const applicationsCollection = client.db('ThriveSecureDB').collection('applications');

        // NEWSLETTER SUBSCRIPTION

        // Posting a Newsletter Subscription
        app.post('/newsletter-subscriptions', async (req, res) => {
            const { name, email, subscribedAt } = req.body;

            if (!name || !email) {
                return res.status(400).json({ message: "Name and email are required." });
            }

            const existing = await newsletterSubscriptionsCollection.findOne({ email });
            if (existing) {
                return res.status(400).json({ message: "This email is already subscribed." });
            }

            const result = await newsletterSubscriptionsCollection.insertOne({
                name,
                email,
                subscribedAt: subscribedAt || new Date().toISOString(),
            });

            res.json({ success: true, insertedId: result.insertedId });
        });

        //USERS

        // Posting a User
        app.post("/users", async (req, res) => {
            const email = req.body.email;
            const userExists = await usersCollection.findOne({ email });
            const now = new Date().toISOString();

            if (userExists) {
                await usersCollection.updateOne(
                    { email },
                    { $set: { lastLogin: now } }
                );

                return res.status(200).json({ message: "User already exists", inserted: false });
            }

            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // GET /users/:email
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;

            const user = await usersCollection.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json(user);
        });

        //   PAYMENT

        // Stripe Setup
        app.post('/create-payment-intent', async (req, res) => {
            const { amount, currency } = req.body; // amount in cents, e.g., 5000 = $50

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency,
                payment_method_types: ['card'],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        // MANAGE APPLICATIONS

        // GET all applications
        app.get("/admin/applications", async (req, res) => {
            const applications = await applicationsCollection.find().toArray();
            res.send(applications);
        });

        // PATCH reject application
        app.patch("/admin/applications/:id/reject", async (req, res) => {
            const { id } = req.params;
            const result = await applicationsCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        status: "Rejected",
                        updatedAt: new Date(),
                    },
                }
            );
            res.send(result);
        });

        // PATCH assign agent to application
        app.patch("/admin/applications/:id/assign", async (req, res) => {
            const { id } = req.params;
            const { agentEmail } = req.body;

            if (!agentEmail) {
                return res.status(400).send({ message: "Agent email is required" });
            }

            const result = await applicationsCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        assignedAgent: agentEmail,
                        status: "Approved",
                        updatedAt: new Date(),
                    },
                }
            );
            res.send(result);
        });

        // MANAGE USERS

        // GET all users
        app.get("/users", async (req, res) => {
            const users = await usersCollection.find().sort({ createdAt: -1 }).toArray();
            res.json(users);
        });

        // PATCH update user role
        app.patch("/users/:id/role", async (req, res) => {
            const { id } = req.params;
            const { role } = req.body;
            if (!["customer", "agent", "admin"].includes(role)) {
                return res.status(400).json({ message: "Invalid role provided." });
            }

            const result = await usersCollection.findOneAndUpdate(
                { _id: new ObjectId(id) },
                { $set: { role: role } },
                { returnDocument: "after" }
            );
            if (!result.value) {
                return res.status(404).json({ message: "User not found." });
            }
            res.json(result.value);
        });

        // DELETE user
        app.delete("users/:id", async (req, res) => {
            const { id } = req.params;

            const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "User not found." });
            }
            res.json({ message: "User deleted successfully." });
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("ThriveSecure is running...");
});
app.listen(port, () => {
    console.log(`ThriveSecure is running on port: ${port}`);
});