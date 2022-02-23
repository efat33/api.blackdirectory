const dotenv = require("dotenv");
dotenv.config();

const stripeSecretKey = process.env.NODE_ENV === 'development' ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
const commonfn = require('../utils/common');
const UserModel = require('../models/user-model');
const EventModel = require('../models/event-model');
const shopModel = require("../models/shop-model");
const shopController = require("../controllers/shop-controller");
const mailHandler = require('../utils/mailHandler.js');

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
      for (let i = 1; i <= parseInt(session.metadata.orderParamCount); i++) {
        order += session.metadata[`order${i}`]
      }

      order = JSON.parse(order);
    } else {
      order = JSON.parse(session.metadata.order1);
    }


    const orderResult = await shopModel.createOrder(order, user);
    await shopModel.clearCartItems(user.id);

    await this.sendOrderEmail(orderResult.data.order_id, user);
  }

  async sendOrderEmail(order_id, user) {
    const order = await shopController.getOrderData(order_id, {});

    this.sendOrderEmailToCustomer(order, user);

    if (order[0].vendor_id) {
      this.sendOrderEmailToVendor(order);
    } else {
      for (const subOrder of order[0].subOrders) {
        const subOrderDetails = await shopController.getOrderData(subOrder.id, {});

        this.sendOrderEmailToVendor(subOrderDetails);
      }
    }
  }

  generateOrderTable(order) {
    const websiteUrl = process.env.WEBSITE_URL;

    const itemsText = order[0].items.reduce((acc, item) => {
      const tr = `<tr>
        <td style="border: 1px solid #666; padding: 3px 5px;"><a href="${websiteUrl}/shop/product/${item.product_slug}">${item.product_title}</a> x ${item.quantity}</td>
        <td style="border: 1px solid #666; padding: 3px 5px; text-align: center;">£${item.product_price}</td>
        <td style="border: 1px solid #666; padding: 3px 5px; text-align: center;">£${item.total}</td>
      </tr>`;

      return acc + tr;
    }, '');

    let tableFooter = `
      <tr>
        <th colspan="2" style="border: 1px solid #666; padding: 3px 5px;">SUBTOTAL</th>
        <td style="border: 1px solid #666; padding: 3px 5px; text-align: center;">£${order[0].subtotal}</td>
      </tr>
    `;

    if (order[0].promo_id != null) {
      tableFooter += `
        <tr>
          <th colspan="2" style="border: 1px solid #666; padding: 3px 5px;">DISCOUNT (${order[0].promo_code})</th>
          <td style="border: 1px solid #666; padding: 3px 5px; text-align: center;">-£${(order[0].subtotal * (order[0].discount / 100)).toFixed(2)}</td>
        </tr>
      `;
    }

    let shippingFee;
    if (order[0].shipping_fee != null) {
      shippingFee = parseFloat(order[0].shipping_fee);
    } else if (order[0].subOrders) {
      shippingFee = order[0].subOrders.reduce((acc, order) => acc + parseFloat(order.shipping_fee), 0);
    }

    if (shippingFee != null) {
      tableFooter += `
        <tr>
          <th colspan="2" style="border: 1px solid #666; padding: 3px 5px;">SHIPPING COSTS</th>
          <td style="border: 1px solid #666; padding: 3px 5px; text-align: center;">£${shippingFee.toFixed(2)}</td>
        </tr>
      `;
    }

    tableFooter += `
      <tr>
        <th colspan="2" style="border: 1px solid #666; padding: 3px 5px;">TOTAL</th>
        <td style="border: 1px solid #666; padding: 3px 5px; text-align: center;">£${order[0].total}</td>
      </tr>
    `;

    let tableString = `<table style="border-collapse: collapse; width: min(100%, 700px); border: 1px solid #666; padding: 3px 5px;">
    <thead>
      <tr>
        <th style="border: 1px solid #666; padding: 3px 5px; width: 70%;">Product</th>
        <th style="border: 1px solid #666; padding: 3px 5px; text-align: center;">Price</th>
        <th style="border: 1px solid #666; padding: 3px 5px; text-align: center;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${itemsText}</tbody>
    <tfoot>${tableFooter}</tfoot>
  </table>`;

    tableString = tableString.replace(/(?:\r\n *|\r *|\n *)/g, '');

    return tableString;
  }

  sendOrderEmailToCustomer(order, user) {
    const websiteUrl = process.env.WEBSITE_URL;
    const tableString = this.generateOrderTable(order);

    let userEmailBody = `Dear ${user.name},

We have received a new order of the following items.

<h3><a href="${websiteUrl}/dashboard/order/${order[0].id}">ORDER #${order[0].id.toString().padStart(5, '0')}</a></h3>${tableString}

Best regards,

Black Directory Team`;

    const userMailOptions = {
      to: user.email,
      subject: 'Black Directory - New Order',
      body: userEmailBody,
    }

    mailHandler.sendEmail(userMailOptions);
  }

  sendOrderEmailToVendor(order) {
    const websiteUrl = process.env.WEBSITE_URL;
    const tableString = this.generateOrderTable(order);

    let emailBody = `Dear ${order[0].vendor_name},

You have received a new order of the following items.

<h3><a href="${websiteUrl}/dashboard/order/${order[0].id}">ORDER #${order[0].id.toString().padStart(5, '0')}</a></h3>${tableString}

Best regards,

Black Directory Team`;

    const mailOptions = {
      to: order[0].vendor_email,
      subject: 'Black Directory - New Order',
      body: emailBody,
    }

    mailHandler.sendEmail(mailOptions);
  }
}

module.exports = new StripeController();

