const express = require('express')
const router = express.Router()
const argon2 = require('argon2-ffi').argon2i
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const Subscriber = require('../models/subscriber')

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'testexpressmongodb@gmail.com',
    pass: 'testingaccount'
  }
});

var validtokens = []


router.get('/', async (req, res) => {
    try {
      const subscribers = await Subscriber.find()
      res.json(subscribers)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
  })

// This endpoint gives the user the token, while pushing it to validtokens array.
router.post('/recovery', getSubscriberByJSON, async (req, res) => {
  var token = crypto.randomBytes(20).toString('hex');
  validtokens.push(token)
  const message = {
    from: 'testexpressmongodb@gmail.com', // Sender address
    to: 'donkovdeo@gmail.com',         // List of recipients
    subject: req.subscriber.name + ' Recovery', // Subject line
    text: 'click here ' + 'http://localhost:3000/subscribers/' + req.subscriber.id + '/resetpassword/' + token
};
transporter.sendMail(message, function(err, info) {
  if (err) {
    console.log(err)
  } else {
    console.log(info);
  }
});
res.status(201)
})

// This endpoint resets the user's password with the given token.
router.get('/:id/resetpassword/:token', getSubscriber, (req, res) => {
  var token = req.params.token
  if(validtokens.includes(token)){
    crypto.randomBytes(32, function(err, salt) { 
      if(err) throw err; 
      argon2.hash("newpassword", salt).then(hash => { 
        try {
          const subscriber = new Subscriber({
            name: req.subscriber.name,
            subscribedChannel: req.subscriber.subscribedChannel,
            subscriberPassword: hash,
            subscriberEmail: req.subscriber.subscriberEmail
          })
          const newSubscriber = subscriber.save()
            res.status(201).json(newSubscriber)
        } catch (err) {
          res.status(400).json({ message: err.message })
        }  
      }); 
    })
    removeA(validtokens, token)
  } else {
    res.status(404)
  }
})

router.get('/:id/resetpassword', getSubscriber, async (req, res) => {
  crypto.randomBytes(32, function(err, salt) { 
    if(err) throw err; 
    argon2.hash("newpassword", salt).then(hash => { 
      try {
        const subscriber = new Subscriber({
          name: req.subscriber.name,
          subscribedChannel: req.subscriber.subscribedChannel,
          subscriberPassword: hash,
          subscriberEmail: req.subscriber.subscriberEmail
        })
        const newSubscriber = subscriber.save()
          res.status(201).json(newSubscriber)
      } catch (err) {
        res.status(400).json({ message: err.message })
      }  
    }); 
  })
})

// Create one subscriber
router.post('/', async (req, res) => {

  crypto.randomBytes(32, function(err, salt) { 
    if(err) throw err; 
    argon2.hash(req.body.subscriberPassword, salt).then(hash => { 
      try {
        const subscriber = new Subscriber({
          name: req.body.name,
          subscribedChannel: req.body.subscribedChannel,
          subscriberPassword: hash,
          subscriberEmail: req.body.subscriberEmail
        })
        const newSubscriber = subscriber.save()
          res.status(201).json(newSubscriber)
      } catch (err) {
        res.status(400).json({ message: err.message })
      }  
    }); 
  })
  });

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

    if(req.body.subscriberEmail != null){
        req.subscriber.subscriberEmail = req.body.subscriberEmail
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
      await req.subscriber.remove()
      res.json({ message: 'Deleted This Subscriber' })
    } catch(err) {
      res.status(500).json({ message: err.message})
    }
  })


async function getSubscriber(req, res, next) {
    try {
      subscriber = await Subscriber.findById(req.params.id)
      if (subscriber == null) {
        return res.status(404).json({ message: 'Cant find subscriber with ' + req.params.id})
      }
    } catch(err){
      return res.status(500).json({ message: err.message})
    }
  
    req.subscriber = subscriber
    next()
  }

module.exports = router

async function getSubscriberByJSON(req, res, next) {
  try {
    subscriber = await Subscriber.findById(req.body.id)
    if (subscriber == null) {
      return res.status(404).json({ message: 'Cant find subscriber with ' + req.params.id})
    }
  } catch(err){
    return res.status(500).json({ message: err.message })
  }

  req.subscriber = subscriber
  next()
}

// Util

function removeA(arr) {
  var what, a = arguments, L = a.length, ax;
  while (L > 1 && arr.length) {
      what = a[--L];
      while ((ax= arr.indexOf(what)) !== -1) {
          arr.splice(ax, 1);
      }
  }
  return arr;
}

module.exports = router