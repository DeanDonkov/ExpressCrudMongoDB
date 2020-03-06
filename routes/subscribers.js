const express = require('express')
const router = express.Router()
var bcrypt = require('bcrypt');
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const Subscriber = require('../models/subscriber')
const fs = require('fs');
const jwt = require('jsonwebtoken');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'testexpressmongodb@gmail.com',
    pass: 'testingaccount'
  }
});

var mailOptions = {
  from: "expresscrudmongodb@gmail.com",
  to: "deandonkov@gmail.com",
  subject: "stuff"
}

var privateKEY = fs.readFileSync('./private.key', 'utf8');
var publicKEY = fs.readFileSync('./public.key', 'utf8');

var signOptions = {
  algorithm:  "RS256"
 };

 var verifyOptions = {
  algorithm:  "RS256"
 };


router.get('/', async (req, res) => {
    try {
      const subscribers = await Subscriber.find()
      res.json(subscribers)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
  })

router.post('/login', async (req, res) => {
  const data = {
    "name": req.body.name
    
  }

})

// This endpoint gives the user the token, while pushing it to validtokens array.
router.post('/recovery', getSubscriberByJSON, async (req, res) => {
var payload = {
  id: req.subscriber.id,
  refresh: new Date().getTime() + 10000
 };
 var token = jwt.sign(payload, privateKEY, signOptions);

res.status(201).json({token: token})
})
/*
router.post('/token', (req, res) => {
  console.log(req.body.refreshToken)
  console.log(req.body.refreshToken in tokenlist)
  console.log(tokenlist)
  if((req.body.refreshToken) && (req.body.refreshToken in tokenlist)){
    const user = {
      "id": req.body.id
    }
    const token = jwt.sign(user, privateKEY, signOptions)
    const response = {
      "token": token
    }
    tokenlist[req.body.refreshToken].token = token
    res.status(200).json(response);
  } else {
    res.status(404).send("Invalid request")
  }
})
*/
// This endpoint resets the user's password with the given token.
router.get('/resetpassword', validateJWT, async (req, res) => {
  var subscriber = await Subscriber.findById(req.jwt.id)
    await bcrypt.hash("newpassword", 12, function(err, hash){
      try {
        const subscriberupdate = new Subscriber({
          name: subscriber.name,
          subscribedChannel: subscriber.subscribedChannel,
          subscriberPassword: hash,
          subscriberEmail: subscriber.subscriberEmail,
          subscriberBlocked: subscriber.subscriberBlocked
        })
        const newSubscriber = subscriberupdate.save()
          return res.status(201).json(newSubscriber)
      } catch (err) {
        return res.status(400).json({ message: err.message })
      }  
    })
})

// Create one subscriber
router.post('/', async (req, res) => {
  bcrypt.hash(req.body.subscriberPassword, 12, function(err, hash){
      try {
        const subscriber = new Subscriber({
          name: req.body.name,
          subscribedChannel: req.body.subscribedChannel,
          subscriberPassword: hash,
          subscriberBlocked: req.body.subscriberBlocked,
          subscriberEmail: req.body.subscriberEmail
        })
        const newSubscriber = subscriber.save()
          res.status(201).json(newSubscriber)
      } catch (err) {
        res.status(400).json({ message: err.message })
      }   
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
      subscriber.name = req.body.name
    }
  
    if (req.body.subscribedChannel != null) {
      subscriber.subscribedChannel = req.body.subscribedChannel
    }

    if (req.body.subscriberPassword != null) {
        subscriber.subscriberPassword = req.body.subscriberPassword
      }

    if(req.body.subscriberEmail != null){
        subscriber.subscriberEmail = req.body.subscriberEmail
    }
    if(req.body.subscriberBlocked != null){
      subscriber.subscriberBlocked = req.body.subscriberBlocked
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
      res.json({ message: 'Deleted This Subscriber'})
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

async function validateJWT(req, res, next){
  var token = req.header('Authorization')
  try {
    var legit = jwt.verify(req.header('Authorization'), publicKEY, verifyOptions);
      var decode = jwt.decode(token)
      if(new Date().getTime() > decode.refresh){
        var sub = await Subscriber.findById(decode.id)
        if(sub.subscriberBlocked){
          res.status(500).json({message: "You're blocked."})
        }
        if(sub){
        const user = {
          id: decode.id,
          refresh: new Date().getTime() + 5000
        }
        decode = user
        }
      }
    
    req.jwt = decode
    return next()
  }
    catch(err) { return res.status(500).json({message: "Invalid token."}) }
  
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
}