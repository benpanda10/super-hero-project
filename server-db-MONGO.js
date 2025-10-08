const { error } = require('console');
const express = require('express');

// not needed for mongoDB
// const fs = require('fs').promises;
// const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/?retryWrites=true&w=majority&appName=Cluster0}`;

let db;

MongoClient.connect(MONGODB_URI)
  .then((client) => {
    console.log("Connected to MongoDB");
    db = client.db("superhero-db");
  })
  .catch((error) => console.error("Could not connect to MongoDB", error));


async function readHeroes() {
    try {
        const data = await db.collection('superheroes').find({}).toArray();
        return data;
    }
    catch (error) {
        return [];
    }
}

app.get("/", (req, res) => {
  const heroFields = require("./config/heroInputs.config.js");
  res.render("heroForm", heroFields);
});
  

app.post('/heroes', async (req, res) => {
    try {
        const heroes = await readHeroes();

        const newHero = {
            id: Date.now().toString(),
            superName: req.body.superName,
            realName: req.body.realName,
            superpower: req.body.superpower,
            powerLevel: parseInt(req.body.powerLevel),
            secretIdentity: req.body.secretIdentity === 'true',
            createdAt: new Date().toISOString()
        };

        await db.collection("superheroes").insertOne(newHero);

        res.json({
            success: true,
            message: 'Hero added successfully!',
            redirectTo: '/heroes'
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
})

app.get('/heroes', async (req, res) => {
    try {
        heroes = await readHeroes();

        if (req.accepts('html')) {
            res.json({heroes: heroes})
        }
        else {
            res.json({ success: true, count: heroes.length, data: heroes });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
})

app.put('/heroes/:id', async (req, res) => {
    try {
        const heroes = await readHeroes();
        const heroUpdated = heroes.find((h) => h.id === req.params.id);

        await db.collection("superheroes").updateOne(
            heroUpdated,
            {
            $set: {
                superName: req.body.superName,
                realName: req.body.realName,
                superpower: req.body.superpower,
                powerLevel: parseInt(req.body.powerLevel),
                secretIdentity: req.body.secretIdentity === "true",
                updatedAt: new Date().toISOString(),
            }
            }
        );



        // if (heroIndex === -1) {
        //     return res.status(404).json({ success: false, error: 'Hero not found' });
        // }

        // heroes[heroIndex] = {
        //   ...heroes[heroIndex],
        //   superName: req.body.superName,
        //   realName: req.body.realName,
        //   superpower: req.body.superpower,
        //   powerLevel: parseInt(req.body.powerLevel),
        //   secretIdentity: req.body.secretIdentity === "true",
        //   updatedAt: new Date().toISOString(),
        // };

        // const result = await db.collection("superheroes").insertMany(req.body);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
})

app.delete('/heroes/:id', async (req, res) => {
    try {
        const heroes = await readHeroes();
        const deletedHero = heroes.find(h => h.id === req.params.id)

        if (!deletedHero) {
            return res.status(404).json({ success: false, error: "Hero not found" });
        }

        await db.collection("superheroes").deleteOne(deletedHero)
        res.json({success: true, message: "Hero deleted!"})
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
})

app.listen(PORT, () => { console.log('server running on 3000') });