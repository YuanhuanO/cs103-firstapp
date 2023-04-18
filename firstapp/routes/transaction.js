const express = require('express');
const router = express.Router();
const User = require('../models/User')
const TransactionItem = require('../models/TransactionItem')
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/', isLoggedIn, async (req, res) => {
  res.locals.user = req.user;
  try {
    const { groupby, sortby } = req.query;
    let transactions;

    if (groupby === 'category') {
      transactions = await TransactionItem.aggregate([
        {
          $group: {
            _id: '$category',
            transactions: { $push: '$$ROOT' },
          },
        },
      ]);
    } else {
      transactions = await TransactionItem.find().sort(
        sortby ? { [sortby]: 1 } : {}
      );
    }

    res.render('transaction', { transactions, user: req.session.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', (req, res) => {
  const { description, category, amount, date } = req.body;
  TransactionItem.create({ description, category, amount, date })
  .then((newTransaction) => {
    res.redirect('/transactions');
  })
  .catch((err) => {
    res.status(500).json({ message: err.message });
  });

});

router.get('/remove/:transactionId',
  isLoggedIn,
  async (req, res, next) => {
    try {
      console.log("inside /transactions/remove/:transactionId")
      const transactionId = req.params.transactionId;
      await TransactionItem.deleteOne({_id: transactionId});
      res.redirect('/transactions');
    } catch (error) {
      res.status(500).json({message: error.message});
    }
});

router.get('/editTransaction/:transactionId',
  isLoggedIn,
  async (req, res, next) => {
    try {
      const transactionId = req.params.transactionId;
      const transactions = await TransactionItem.findById(transactionId);
      res.render('editTransaction', { transactions });
    } catch (error) {
      res.status(500).json({message: error.message});
    }
});

router.post('/editTransaction/:transactionId', isLoggedIn, async (req, res, next) => {
  const { description, category, amount, date } = req.body;
  const transactionId = req.params.transactionId;

  try {
    await TransactionItem.findByIdAndUpdate(req.params.transactionId, {
        description: req.body.description,
        amount: req.body.amount,
        category: req.body.category,
        date: req.body.date
    });

    res.redirect('/transactions');
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

router.get('/groupbycategory', isLoggedIn, async (req, res) => {
  res.locals.user = req.user;
  try {
    const transactions = await TransactionItem.aggregate([
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    res.render('groupedtransactions', { transactions, user: req.session.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;