const express = require('express')
const router = express.Router()

const Subscriber = require('../models/subscriber')

router.get('/', async (req, res) => {
    try {
      const subscribers = await Subscriber.find()
      res.json(subscribers)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
  })


// Create one subscriber
router.post('/login', async (req, res) => {
    var password
    argon2.generateSalt().then(salt => {
        argon2.hash(req.body.subscriberPassword, salt).then(hash => {
          console.log('Successfully created Argon2 hash:', hash);
          const subscriber = new Subscriber({
            name: req.body.name,
            subscribedChannel: req.body.subscribedChannel,
            subscriberPassword: password
          })
        try {
          const newSubscriber = await subscriber.save()
          res.status(201).json(newSubscriber)
        } catch (err) {
          res.status(400).json({ message: err.message })
        }
        });
      });
    })

  // Get one subscriber
router.get('/:id', getSubscriber, (req, res) => {
    res.json(req.subscriber)
})

// Update Subscriber

router.patch('/:id', getSubscriber, async (req, res) => {
    const subscriber = req.subscriber
    if (req.body.name != null) {
      req.subscriber.name = req.body.name
    }
  
    if (req.body.subscribedChannel != null) {
      req.subscriber.subscribedChannel = req.body.subscribedChannel
    }

    if (req.body.subscriberPassword != null) {
        req.subscriber.subscriberPassword = req.body.subscriberPassword
      }
    try {
      const updatedSubscriber = await subscriber.save()
      res.json(updatedSubscriber)
    } catch {
      res.status(400).json({ message: err.message })
    }
  
  })

// Delete one subscriber

router.delete('/:id', getSubscriber, async (req, res) => {
    try {
      await res.subscriber.remove()
      res.json({ message: 'Deleted This Subscriber' })
    } catch(err) {
      res.status(500).json({ message: err.message })
    }
  })


async function getSubscriber(req, res, next) {
    try {
      subscriber = await Subscriber.findById(req.params.id)
      if (subscriber == null) {
        return res.status(404).json({ message: 'Cant find subscriber'})
      }
    } catch(err){
      return res.status(500).json({ message: err.message })
    }
  
    req.subscriber = subscriber
    next()
  }

module.exports = router