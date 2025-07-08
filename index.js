const express = require('express');
const cors = require('cors');
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@thrivesecure.x2ofshd.mongodb.net/?retryWrites=true&w=majority&appName=ThriveSecure`;

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

        // Database Initializing
        const usersCollection = client.db('ThriveSecureDB').collection('users');

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