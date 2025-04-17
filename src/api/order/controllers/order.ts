"use strict";

const stripeLib = require("stripe");
const { createCoreController } = require("@strapi/strapi").factories;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeLib(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia", // hoặc phiên bản bạn cần dùng
});
const sendEmailOrder = require("../../../utils/sendEmailOrder");

const YOUR_DOMAIN = "http://localhost:5173/cart";

const generateOrderId = () => {
  return `DH${Date.now()}`;
};

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  // Phương thức tạo đơn hàng
  async create(ctx) {
    const { orders, email, address, phoneNumber, note } = ctx.request.body;
    try {
      if (!orders || !email) {
        return ctx.badRequest("Missing orders or email");
      }

      let totalPrice = 0;
      const stripeLineItems = [];
      const orderItemsData = [];

      // Xử lý từng sản phẩm trong đơn hàng
      for (const order of orders) {
        const product = await strapi
          .service("api::cart.cart")
          .findOne(order.productId);

        if (!product) {
          throw new Error(`Product with ID ${order.productId} not found`);
        }
        const unitPrice =
          product.price && product.price > 0 ? Math.round(product.price) : 0;
        totalPrice += unitPrice * order.quantity;

        // Chuẩn bị dữ liệu cho Stripe
        stripeLineItems.push({
          price_data: {
            currency: "vnd",
            product_data: { name: product.name || "Unnamed Product" },
            unit_amount: unitPrice,
          },
          quantity: order.quantity,
        });

        // Chuẩn bị dữ liệu cho OrderItem
        orderItemsData.push({
          name: product.name || "Unnamed Product",
          price: unitPrice,
          quantity: order.quantity,
          image: order.image,
          size: order.size || "",
        });
      }

      // Tạo order trong Strapi trước để có orderId
      const createdOrder = await strapi.service("api::order.order").create({
        data: {
          orderId: generateOrderId(), // Mã order tự tạo
          email,
          total_price: totalPrice,
          status_order: "Chờ thanh toán",
          address_shipping: address,
          phone_number: phoneNumber,
          note,
        },
      });
      console.log("createdOrder", createdOrder);

      // Tạo phiên thanh toán Stripe với success_url chứa orderId
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: stripeLineItems,
        customer_email: email,
        success_url: `${YOUR_DOMAIN}?success=true&order_id=${createdOrder.orderId}`,
        cancel_url: `${YOUR_DOMAIN}?cancel=true&order_id=${createdOrder.orderId}`,
      });

      await Promise.all(
        orderItemsData.map((item) =>
          strapi.service("api::order-item.order-item").create({
            data: {
              order: createdOrder.orderId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
              size: item.size,
            },
          })
        )
      );

      return { stripeSession: session };
    } catch (error) {
      console.error("Checkout process error:", error);
      ctx.response.status = 500;
      return {
        error: error?.message || "Payment processing failed",
        details: process.env.NODE_ENV === "development" ? error : null,
      };
    }
  },
  async sendEmailOrder(ctx) {
    const { order_id, order_items, type } = ctx.request.body;
    console.log("data", order_id, order_items, type);
    if (!order_id || !type) {
      return ctx.badRequest("Thiếu thông tin cần thiết");
    }

    // Lấy thông tin order theo orderId
    // 1. Lấy order chính
    const orderData = await strapi.db.query("api::order.order").findOne({
      where: { orderId: order_id },
    });

    if (!orderData) {
      return ctx.notFound("Không tìm thấy đơn hàng");
    }

    console.log("order_items", order_items);

    // Gọi hàm gửi email
    await sendEmailOrder({
      strapi,
      email: orderData.email,
      orderId: orderData.orderId,
      orderItemsData: order_items,
      totalPrice: orderData.total_price,
      phoneNumber: orderData.phone_number,
      address: orderData.address_shipping,
      note: orderData.note,
      type,
    });

    return ctx.send({ message: "Đã gửi email thông báo đơn hàng" });
  },
}));
