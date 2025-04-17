export default {
  routes: [
    {
      method: "POST",
      path: "/order/sendEmailOrder",
      handler: "order.sendEmailOrder",
      config: {
        auth: false,
      },
    },
  ],
};
