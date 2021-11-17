const dotenv = require("dotenv");
dotenv.config();

const stripeSecretKey = process.env.NODE_ENV === 'development' ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
const commonfn = require('../utils/common');
const UserModel = require('../models/user-model');
const EventModel = require('../models/event-model');
const shopModel = require("../models/shop-model");

class StripeController {
  stripeWebhook = async (req, res, next) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      const webhookSecret = process.env.NODE_ENV === "development" ? process.env.STRIPE_WEBHOOK_SECRET_LOCALHOST : process.env.STRIPE_TEST_WEBHOOK_SECRET;
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.metadata.type === 'job') {
        await this.jobPackageHook(session);
      } else if (session.metadata.type === 'event') {
        await this.eventPackageHook(session);
      } else if (session.metadata.type === 'shop') {
        await this.shopPackageHook(session);
      }
    }

    res.status(200).send();
  };

  jobPackageHook = async (session) => {
    const date = new Date();
    const purchaseDate = commonfn.dateTimeNow();
    const expireDate = commonfn.dateTime(new Date(date.setMonth(date.getMonth() + parseInt(session.metadata.validity))));

    const meta = {
      package: session.metadata.packageId,
      package_price: session.metadata.priceId,
      package_purchase_date: purchaseDate,
      package_expire_date: expireDate,
    }

    await UserModel.updateUserPostMeta(session.metadata.userId, meta);
  }

  eventPackageHook = async (session) => {
    const meta = {
      items: JSON.parse(session.metadata.items),
      event_id: parseInt(session.metadata.eventId),
      user_id: parseInt(session.metadata.userId)
    }

    await EventModel.buyEventTickets(meta.items, meta.event_id, meta.user_id);
  }

  shopPackageHook = async (session) => {
    const user = JSON.parse(session.metadata.user);
    
    let order = '';
    if (parseInt(session.metadata.orderParamCount) > 1) {
      for (let i=1; i <= parseInt(session.metadata.orderParamCount); i++) {
        order += session.metadata[`order${i}`]
      }

      order = JSON.parse(order);
    } else {
      order = JSON.parse(session.metadata.order1);
    }


    await shopModel.createOrder(order, user);
    await shopModel.clearCartItems(user.id);
  }
}

module.exports = new StripeController();

