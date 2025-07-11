const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
        const policiesCollection = client.db('ThriveSecureDB').collection('policies');
        const transactionsCollection = client.db('ThriveSecureDB').collection('transactions');

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
        app.get("/applications", async (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const totalCount = await applicationsCollection.countDocuments();
            const totalPages = Math.ceil(totalCount / limit);

            const applications = await applicationsCollection
                .find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            res.send({
                applications,
                totalPages,
            });
        });

        // PATCH reject application
        app.patch("/applications/:id/reject", async (req, res) => {
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
        app.patch("/applications/:id/assign", async (req, res) => {
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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const skip = (page - 1) * limit;

            const totalCount = await usersCollection.countDocuments();
            const totalPages = Math.ceil(totalCount / limit);

            const users = await usersCollection
                .find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            res.json({
                users,
                totalPages,
            });
        });

        // PATCH update user role
        app.patch("/users/:id/role", async (req, res) => {
            const { id } = req.params;
            const { role } = req.body;
            if (!["customer", "agent", "admin"].includes(role)) {
                return res.status(400).json({ message: "Invalid role provided." });
            }

            const result = await usersCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { role: role } }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "User not found." });
            }
            res.json({ success: true, modifiedCount: result.modifiedCount });
        });

        // DELETE user
        app.delete("/users/:id", async (req, res) => {
            const { id } = req.params;

            const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "User not found." });
            }
            res.json({ message: "User deleted successfully." });
        });

        // MANAGE POLICIES

        // Get Policies (with Pagination)
        app.get("/policies", async (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5 || 9;
            const skip = (page - 1) * limit;

            const total = await policiesCollection.countDocuments();
            const policies = await policiesCollection
                .find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            res.json({
                policies,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            });
        });

        // Add New Policy
        app.post("/policies", async (req, res) => {
            const newPolicy = { ...req.body, createdAt: new Date() };
            const result = await policiesCollection.insertOne(newPolicy);
            res.status(201).json({ insertedId: result.insertedId });
        });

        // Update Policy
        app.patch("/policies/:id", async (req, res) => {
            const { id } = req.params;
            const updatedPolicy = req.body;

            const result = await policiesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedPolicy }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ error: "Policy not found or unchanged" });
            }

            res.json({ message: "Policy updated successfully" });
        });

        // Delete Policy
        app.delete("/policies/:id", async (req, res) => {
            const { id } = req.params;

            const result = await policiesCollection.deleteOne({ _id: new ObjectId(id) });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: "Policy not found" });
            }

            res.json({ message: "Policy deleted successfully" });
        });

        // MANAGE TRANSACTIONS

        // GET /transactions with filters, pagination
        app.get("/transactions", async (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const skip = (page - 1) * limit;

            const { startDate, endDate, user, policy } = req.query;

            const filter = {};

            if (startDate && endDate) {
                filter.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }

            if (user) {
                filter.userEmail = { $regex: new RegExp(user, "i") };
            }

            if (policy) {
                filter.policyName = { $regex: new RegExp(policy, "i") };
            }

            const totalCount = await transactionsCollection.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / limit);

            const transactions = await transactionsCollection
                .find(filter)
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            res.json({
                transactions,
                totalPages,
            });
        });

        // GET /transactions/summary
        app.get("/transactions/summary", async (req, res) => {
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);

            const totalIncome = await transactionsCollection.aggregate([
                { $match: { status: "Success" } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]).toArray();

            const last30DaysTransactions = await transactionsCollection.find({
                date: { $gte: thirtyDaysAgo }
            }).toArray();

            const total = last30DaysTransactions.length || 1;
            const successCount = last30DaysTransactions.filter(txn => txn.status === "Success").length;
            const failCount = last30DaysTransactions.filter(txn => txn.status === "Failed").length;

            const successRate = ((successCount / total) * 100).toFixed(2);
            const failRate = ((failCount / total) * 100).toFixed(2);

            res.json({
                totalIncome: totalIncome[0]?.total || 0,
                successRate: parseFloat(successRate),
                failRate: parseFloat(failRate)
            });
        });

        // MANAGE AGENTS


        // CUSTOMER

        // MY POLICIES


        // POLICY DETAILS
        // GET a specific policy by ID
        app.get("/policies/:id", async (req, res) => {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid policy ID format." });
            }

            const policy = await policiesCollection.findOne({ _id: new ObjectId(id) });

            if (!policy) {
                return res.status(404).json({ message: "Policy not found." });
            }

            res.json(policy);
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